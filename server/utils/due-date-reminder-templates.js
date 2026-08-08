/*!
 * Fork addition — message templates for due-date reminders, one per
 * frequency tier scan.js already computes (via daysUntilDue). Kept in one
 * place, separate from dispatch, so wording can be edited without touching
 * delivery logic.
 */

const escapeMarkdown = require('escape-markdown');
const escapeHtml = require('escape-html');

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;

const Tiers = {
  FAR_OUT: 'farOut',
  TWO_DAYS: 'twoDays',
  ONE_DAY: 'oneDay',
  DUE_TODAY: 'dueToday',
  OVERDUE: 'overdue',
};

const pluralize = (count, singular) => `${count} ${singular}${count === 1 ? '' : 's'}`;

// Emoji blocks rather than box-drawing characters (▓░ etc.): guaranteed to
// render identically across every Discord client (mobile/desktop/web),
// where box-drawing glyphs depend on font support and often look inconsistent.
const PROGRESS_BAR_LENGTH = 10;
const PROGRESS_BAR_FILLED = '🟩';
const PROGRESS_BAR_EMPTY = '⬜';

const buildProgressBar = (completed, total) => {
  const filledCount = Math.round((completed / total) * PROGRESS_BAR_LENGTH);

  return (
    PROGRESS_BAR_FILLED.repeat(filledCount) +
    PROGRESS_BAR_EMPTY.repeat(PROGRESS_BAR_LENGTH - filledCount)
  );
};

// Coarse duration for the far-out tiers — reuses scan.js's own daysUntilDue,
// no separate day-level math.
const formatDaysLeft = (daysUntilDue) => pluralize(Math.abs(daysUntilDue), 'day');

// Fine-grained duration for due-today/overdue, computed from the exact
// dueDate instant rather than the calendar-day-level daysUntilDue.
const formatHoursOrMinutes = (ms) => {
  const absMs = Math.abs(ms);
  const hours = Math.round(absMs / MS_PER_HOUR);

  if (hours >= 1) {
    return pluralize(hours, 'hour');
  }

  return pluralize(Math.max(1, Math.round(absMs / MS_PER_MINUTE)), 'minute');
};

// Discord embed sidebar color per tier — matches the emoji already in body().
const COLOR_BY_TIER = {
  [Tiers.FAR_OUT]: 0x2ecc71,
  [Tiers.TWO_DAYS]: 0xf1c40f,
  [Tiers.ONE_DAY]: 0xe67e22,
  [Tiers.DUE_TODAY]: 0xe74c3c,
  [Tiers.OVERDUE]: 0x992d22,
};

const selectTier = (daysUntilDue) => {
  if (daysUntilDue < 0) {
    return Tiers.OVERDUE;
  }
  if (daysUntilDue === 0) {
    return Tiers.DUE_TODAY;
  }
  if (daysUntilDue === 1) {
    return Tiers.ONE_DAY;
  }
  if (daysUntilDue === 2) {
    return Tiers.TWO_DAYS;
  }
  return Tiers.FAR_OUT;
};

// { title, body(name, time) } per tier. `time` arrives pre-formatted, so
// these stay plain string templates.
const TEMPLATES_BY_TIER = {
  [Tiers.FAR_OUT]: {
    title: 'Upcoming Due Date',
    body: (name, time) => `🟢 Reminder: '${name}' is due in ${time}.`,
  },
  [Tiers.TWO_DAYS]: {
    title: 'Upcoming Due Date',
    body: (name, time) => `🟡 '${name}' is due in ${time}.`,
  },
  [Tiers.ONE_DAY]: {
    title: 'Due Date Tomorrow',
    body: (name, time) => `🟠 '${name}' is due tomorrow (${time})!`,
  },
  [Tiers.DUE_TODAY]: {
    title: 'Due Today',
    body: (name, time) => `🔴 '${name}' is due today — ${time} left!`,
  },
  [Tiers.OVERDUE]: {
    title: 'Card Overdue',
    body: (name, time) => `🚨 '${name}' is overdue by ${time}!`,
  },
};

// Same pattern as the card links already built for other notifications (see
// notifications/create-many.js): {BASE_URL}/cards/:id, per client/src/constants/Paths.js.
const buildCardUrl = (card) => `${sails.config.custom.baseUrl}/cards/${card.id}`;

// { title, cardName, cardUrl, body, color, discordFields, bodyByFormat }.
// `bodyByFormat` (text/markdown/html) matches the shape
// sails.helpers.utils.sendNotifications already expects (Apprise) — each
// includes a trailing link, since Apprise targets render as plain messages
// with no separate "link" concept.
// `cardName` + `cardUrl` + `body` + `color` + `discordFields` are for the
// Discord bot's native embed: card name as the (linked) title, the tier
// message as the description, and card metadata as fields — Discord-only
// because discordFields uses Discord's own <t:unix:F> timestamp markup
// (auto-localizes per viewer), which would show as literal text anywhere else.
const buildDueDateReminderMessage = ({
  card,
  list,
  board,
  project,
  taskProgress,
  dueDate,
  daysUntilDue,
  now,
}) => {
  const tier = selectTier(daysUntilDue);
  const template = TEMPLATES_BY_TIER[tier];

  const time =
    tier === Tiers.DUE_TODAY || tier === Tiers.OVERDUE
      ? formatHoursOrMinutes(dueDate.getTime() - now.getTime())
      : formatDaysLeft(daysUntilDue);

  const cardUrl = buildCardUrl(card);
  const body = template.body(card.name, time);

  const dueUnixSeconds = Math.floor(dueDate.getTime() / 1000);

  const discordFields = [
    { name: 'Due', value: `<t:${dueUnixSeconds}:F> (<t:${dueUnixSeconds}:R>)` },
    ...(project ? [{ name: 'Project', value: project.name, inline: true }] : []),
    ...(board ? [{ name: 'Board', value: board.name, inline: true }] : []),
    // list.name is nullable in the schema (unlike project.name/board.name) —
    // e.g. archive/trash-type lists may have no name set. A null field value
    // makes discord.js's EmbedBuilder.addFields reject the whole embed.
    ...(list ? [{ name: 'List', value: list.name || 'Untitled', inline: true }] : []),
    ...(taskProgress
      ? [
          {
            name: 'Tasks',
            value: `${buildProgressBar(taskProgress.completed, taskProgress.total)} ${taskProgress.completed}/${taskProgress.total}`,
            inline: true,
          },
        ]
      : []),
  ];

  return {
    title: template.title,
    cardName: card.name,
    cardUrl,
    body,
    color: COLOR_BY_TIER[tier],
    discordFields,
    bodyByFormat: {
      text: `${body}\n\nView card: ${cardUrl}`,
      markdown: `${template.body(escapeMarkdown(card.name), time)}\n\n[View card](${cardUrl})`,
      // Link text is the URL itself, not a label like "View card": Apprise
      // downgrades html -> text for any target that doesn't declare HTML
      // support (common — e.g. most push-style services), and its converter
      // drops the <a> tag's href entirely, keeping only the visible text. A
      // label would vanish the link outright; the URL as link text survives
      // as plain, still-usable text either way.
      html: `${template.body(escapeHtml(card.name), time)}<br /><br /><a href="${cardUrl}">${cardUrl}</a>`,
    },
  };
};

module.exports = {
  Tiers,
  selectTier,
  buildDueDateReminderMessage,
};
