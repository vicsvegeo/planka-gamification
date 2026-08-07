/*!
 * Fork addition — the due-date reminder scanner. Evaluates every incomplete
 * card with a due date and, where a recipient's local schedule calls for it,
 * logs and records a reminder in `card_reminders`.
 *
 * Frequency tiers (reminders/day) by daysUntilDue:
 *   > 2 days out -> 1   |   2 days out -> 2   |   1 day out -> 3
 *   0 days out (due today) -> hourly, all 24 hours, waking-hours window ignored
 *   overdue (< 0)          -> 1/day, indefinitely, tagged as overdue
 *
 * For all non-"due today" tiers, N target slots are spaced through the
 * 9am-9pm local waking-hours window via:
 *   slot_i = windowStart + (i + 1) * (windowSpan / (N + 1))   for i in 0..N-1
 *
 * A slot is "already sent" once a card_reminders row exists whose sent_at
 * falls in that same local (recipient-timezone) hour today — not just a
 * count of today's rows — so re-running the scanner within the same hour
 * (e.g. manual triggers, or the due-today tier where every hour is a slot)
 * never double-sends. Dedup is per card, not per recipient, because that's
 * the shape of the existing card_reminders table (id, card_id, sent_at).
 */

/* eslint-disable no-await-in-loop, no-restricted-syntax, no-continue */

const { buildDueDateReminderMessage } = require('../../../utils/due-date-reminder-templates');

const WAKING_HOURS_START = 9;
const WAKING_HOURS_END = 21;
const WAKING_HOURS_SPAN = WAKING_HOURS_END - WAKING_HOURS_START;

const DEFAULT_TIMEZONE = 'UTC';

const computeDaysUntilDue = (dueDate, now) => {
  const startOfUtcDay = (date) =>
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const msPerDay = 24 * 60 * 60 * 1000;

  return Math.round((startOfUtcDay(dueDate) - startOfUtcDay(now)) / msPerDay);
};

// Target slot hours (0-23, local time) for today, given how many days out the card is.
const computeSlotHours = (daysUntilDue) => {
  if (daysUntilDue === 0) {
    return _.range(24);
  }

  let targetCount;
  if (daysUntilDue === 1) {
    targetCount = 3;
  } else if (daysUntilDue === 2) {
    targetCount = 2;
  } else {
    // > 2 days out, or overdue — both are a flat 1/day.
    targetCount = 1;
  }

  return _.range(targetCount).map((i) =>
    Math.round(WAKING_HOURS_START + (i + 1) * (WAKING_HOURS_SPAN / (targetCount + 1))),
  );
};

// { dateKey: 'YYYY-MM-DD', hour: 0-23 } for `date`, as observed in `timeZone`.
const getLocalDateParts = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  })
    .formatToParts(date)
    .reduce((result, part) => ({ ...result, [part.type]: part.value }), {});

  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour) % 24,
  };
};

module.exports = {
  async fn() {
    const now = new Date();

    const cards = await Card.qm.getIncompleteWithDueDate();

    if (cards.length === 0) {
      sails.log.info('[card-reminders] No incomplete cards with a due date — nothing to scan.');
      return { evaluated: 0, sent: 0 };
    }

    const cardIds = sails.helpers.utils.mapRecords(cards);

    const [cardMemberships, existingReminders, ownerUser] = await Promise.all([
      CardMembership.qm.getByCardIds(cardIds),
      CardReminder.qm.getByCardIds(cardIds),
      User.qm.getOneOwner(),
    ]);

    const memberUserIdsByCardId = _.groupBy(cardMemberships, 'cardId');
    const remindersByCardId = _.groupBy(existingReminders, 'cardId');

    const relevantUserIds = _.uniq([
      ...sails.helpers.utils.mapRecords(cardMemberships, 'userId'),
      ...(ownerUser ? [ownerUser.id] : []),
    ]);
    const userById = _.keyBy(await User.qm.getByIds(relevantUserIds), 'id');

    let sentCount = 0;

    for (const card of cards) {
      const daysUntilDue = computeDaysUntilDue(new Date(card.dueDate), now);
      const isOverdue = daysUntilDue < 0;
      const slotHours = computeSlotHours(daysUntilDue);

      const memberUserIds = (memberUserIdsByCardId[card.id] || []).map((m) => m.userId);

      let recipients;
      if (memberUserIds.length > 0) {
        recipients = memberUserIds.map((userId) => userById[userId]).filter(Boolean);
      } else if (ownerUser) {
        recipients = [ownerUser];
      } else {
        sails.log.warn(
          `[card-reminders] Card ${card.id} ("${card.name}") has no assignees and no owner user exists — skipping.`,
        );
        continue;
      }

      if (recipients.length > 1) {
        sails.log.info(
          `[card-reminders] Card ${card.id} ("${card.name}") has ${recipients.length} assignees; ` +
            'evaluating each independently for slot timing (still a single card_reminders row on send).',
        );
      }

      const cardRemindersToday = remindersByCardId[card.id] || [];

      const dueRecipients = recipients
        .map((recipient) => {
          const timeZone = recipient.lastTimezone || DEFAULT_TIMEZONE;
          const { dateKey: todayKey, hour: currentHour } = getLocalDateParts(now, timeZone);

          const slotIndex = slotHours.indexOf(currentHour);
          if (slotIndex === -1) {
            return null;
          }

          const alreadySentThisHour = cardRemindersToday.some((reminder) => {
            const sentParts = getLocalDateParts(new Date(reminder.sentAt), timeZone);
            return sentParts.dateKey === todayKey && sentParts.hour === currentHour;
          });

          if (alreadySentThisHour) {
            return null;
          }

          return { recipient, timeZone, currentHour, slotIndex };
        })
        .filter(Boolean);

      if (dueRecipients.length === 0) {
        continue;
      }

      // Message content only depends on the card (tier is driven by
      // daysUntilDue, which is card-level), so it's built once and reused
      // for every due recipient of this card.
      const message = buildDueDateReminderMessage({
        card,
        dueDate: new Date(card.dueDate),
        daysUntilDue,
        now,
      });

      await Promise.all(
        dueRecipients.map(({ recipient, timeZone, currentHour, slotIndex }) => {
          sails.log.info(
            `[card-reminders] DUE — card=${card.id} ("${card.name}") ` +
              `recipient=${recipient.id} (${recipient.email}) tz=${timeZone} ` +
              `daysUntilDue=${daysUntilDue} overdue=${isOverdue} ` +
              `slot=${slotIndex + 1}/${slotHours.length} (local hour ${currentHour}:00)`,
          );

          return sails.helpers.cardReminders.sendDueDateReminder(recipient, message, {
            cardId: card.id,
            cardName: card.name,
            daysUntilDue,
            overdue: isOverdue,
            slot: `${slotIndex + 1}/${slotHours.length}`,
          });
        }),
      );

      // One card_reminders row per card per send event, regardless of how
      // many of its recipients had a slot due this run (see file header).
      await CardReminder.qm.createOne({
        cardId: card.id,
        sentAt: now.toISOString(),
      });

      sentCount += 1;
    }

    sails.log.info(
      `[card-reminders] Scan complete. Evaluated ${cards.length} card(s), sent ${sentCount} reminder(s).`,
    );

    return { evaluated: cards.length, sent: sentCount };
  },
};
