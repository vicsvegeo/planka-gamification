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
 *
 * daysUntilDue (and therefore the tier) is computed per recipient, from the
 * calendar-date difference between dueDate and "now" as observed in THAT
 * recipient's timezone — not raw UTC dates. A card due 09:00 UTC is already
 * "today" for a recipient east of UTC while it's still "yesterday evening"
 * UTC-wise, and still "tomorrow" for a recipient far west of UTC; comparing
 * UTC calendar dates instead would miscategorize the tier for both.
 *
 * card_snooze (per card, per user — a fully separate mechanism from
 * project_snooze/project_nudges) filters out individual recipients whose
 * slot is otherwise due this run: skipping one recipient never affects any
 * other recipient on the same card, and — same precedent as
 * project-nudges/scan.js for "every candidate recipient snoozed" — if that
 * filtering empties a card's due-this-run recipient list, nothing is
 * dispatched and no card_reminders row is logged for it this run.
 */

/* eslint-disable no-await-in-loop, no-restricted-syntax, no-continue */

const { buildDueDateReminderMessage } = require('../../../utils/due-date-reminder-templates');

const WAKING_HOURS_START = 9;
const WAKING_HOURS_END = 21;
const WAKING_HOURS_SPAN = WAKING_HOURS_END - WAKING_HOURS_START;

const DEFAULT_TIMEZONE = 'UTC';

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

// Calendar-day difference between dueDate and now, both read as local
// calendar dates in `timeZone` (not raw UTC dates — see file header).
const computeDaysUntilDue = (dueDate, now, timeZone) => {
  const startOfLocalDay = (date) => {
    const { dateKey } = getLocalDateParts(date, timeZone);
    const [year, month, day] = dateKey.split('-').map(Number);

    return Date.UTC(year, month - 1, day);
  };
  const msPerDay = 24 * 60 * 60 * 1000;

  return Math.round((startOfLocalDay(dueDate) - startOfLocalDay(now)) / msPerDay);
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

module.exports = {
  async fn() {
    const now = new Date();

    const cards = await Card.qm.getIncompleteWithDueDate();

    if (cards.length === 0) {
      sails.log.info('[card-reminders] No incomplete cards with a due date — nothing to scan.');
      return { evaluated: 0, sent: 0 };
    }

    const cardIds = sails.helpers.utils.mapRecords(cards);
    const listIds = sails.helpers.utils.mapRecords(cards, 'listId', true);
    const boardIds = sails.helpers.utils.mapRecords(cards, 'boardId', true);

    const [cardMemberships, existingReminders, ownerUser, lists, boards, taskLists] =
      await Promise.all([
        CardMembership.qm.getByCardIds(cardIds),
        CardReminder.qm.getByCardIds(cardIds),
        User.qm.getOneOwner(),
        List.qm.getByIds(listIds),
        Board.qm.getByIds(boardIds),
        TaskList.qm.getByCardIds(cardIds),
      ]);

    const memberUserIdsByCardId = _.groupBy(cardMemberships, 'cardId');
    const remindersByCardId = _.groupBy(existingReminders, 'cardId');
    const listById = _.keyBy(lists, 'id');
    const boardById = _.keyBy(boards, 'id');
    const taskListsByCardId = _.groupBy(taskLists, 'cardId');

    const taskListIds = sails.helpers.utils.mapRecords(taskLists);
    const tasksByTaskListId = _.groupBy(await Task.qm.getByTaskListIds(taskListIds), 'taskListId');

    const projectIds = sails.helpers.utils.mapRecords(boards, 'projectId', true);
    const projectById = _.keyBy(await Project.qm.getByIds(projectIds), 'id');

    const relevantUserIds = _.uniq([
      ...sails.helpers.utils.mapRecords(cardMemberships, 'userId'),
      ...(ownerUser ? [ownerUser.id] : []),
    ]);
    const userById = _.keyBy(await User.qm.getByIds(relevantUserIds), 'id');

    let sentCount = 0;

    for (const card of cards) {
      const dueDate = new Date(card.dueDate);

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

      let dueRecipients = recipients
        .map((recipient) => {
          const timeZone = recipient.lastTimezone || DEFAULT_TIMEZONE;
          const daysUntilDue = computeDaysUntilDue(dueDate, now, timeZone);
          const slotHours = computeSlotHours(daysUntilDue);
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

          return {
            recipient,
            timeZone,
            currentHour,
            slotIndex,
            slotHours,
            daysUntilDue,
            isOverdue: daysUntilDue < 0,
          };
        })
        .filter(Boolean);

      if (dueRecipients.length === 0) {
        continue;
      }

      // card_snooze: skip this specific recipient's reminder for this specific card only —
      // never affects other recipients on the same card, or project-level nudges.
      const notSnoozedDueRecipients = [];
      for (const dueRecipient of dueRecipients) {
        const isSnoozed = await CardSnooze.qm.isSnoozed(card.id, dueRecipient.recipient.id);

        if (isSnoozed) {
          sails.log.info(
            `[card-reminders] Recipient ${dueRecipient.recipient.id} (${dueRecipient.recipient.email}) ` +
              `has snoozed card ${card.id} ("${card.name}") — skipping this recipient only.`,
          );
          continue;
        }

        notSnoozedDueRecipients.push(dueRecipient);
      }

      if (notSnoozedDueRecipients.length === 0) {
        sails.log.info(
          `[card-reminders] Card ${card.id} ("${card.name}") — every recipient due this run has ` +
            'this card snoozed; no reminder sent, no row logged.',
        );
        continue;
      }

      dueRecipients = notSnoozedDueRecipients;

      const board = boardById[card.boardId];

      const cardTasks = (taskListsByCardId[card.id] || []).flatMap(
        (taskList) => tasksByTaskListId[taskList.id] || [],
      );
      const taskProgress =
        cardTasks.length > 0
          ? {
              completed: cardTasks.filter((task) => task.isCompleted).length,
              total: cardTasks.length,
            }
          : null;

      // Tier (daysUntilDue) is now per-recipient, so the message — its
      // wording depends on the tier — is built per recipient too, rather
      // than once for the whole card.
      await Promise.all(
        dueRecipients.map(
          ({ recipient, timeZone, currentHour, slotIndex, slotHours, daysUntilDue, isOverdue }) => {
            const message = buildDueDateReminderMessage({
              card,
              list: listById[card.listId],
              board,
              project: board && projectById[board.projectId],
              taskProgress,
              dueDate,
              daysUntilDue,
              now,
            });

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
          },
        ),
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
