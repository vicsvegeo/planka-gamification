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

// { title, bodyByFormat: { text, markdown, html } } — matches the shape
// sails.helpers.utils.sendNotifications already expects.
const buildDueDateReminderMessage = ({ card, dueDate, daysUntilDue, now }) => {
  const tier = selectTier(daysUntilDue);
  const template = TEMPLATES_BY_TIER[tier];

  const time =
    tier === Tiers.DUE_TODAY || tier === Tiers.OVERDUE
      ? formatHoursOrMinutes(dueDate.getTime() - now.getTime())
      : formatDaysLeft(daysUntilDue);

  return {
    title: template.title,
    bodyByFormat: {
      text: template.body(card.name, time),
      markdown: template.body(escapeMarkdown(card.name), time),
      html: template.body(escapeHtml(card.name), time),
    },
  };
};

module.exports = {
  Tiers,
  selectTier,
  buildDueDateReminderMessage,
};
