/*!
 * Fork addition — message templates for project inactivity nudges, one per
 * tier project-nudges/scan.js already computes (via daysSilent). Mirrors
 * due-date-reminder-templates.js's structure/conventions.
 */

const escapeMarkdown = require('escape-markdown');
const escapeHtml = require('escape-html');

const Tiers = {
  STALE: 'stale',
  VERY_STALE: 'veryStale',
};

// Discord embed sidebar color per tier — matches the emoji already in body().
const COLOR_BY_TIER = {
  [Tiers.STALE]: 0xf1c40f,
  [Tiers.VERY_STALE]: 0xe74c3c,
};

// { title, body(name, daysSilent) } per tier. Only the very-stale tier
// carries the snooze hint — the snooze mechanisms it references (chat
// command, reaction) aren't built yet, but the hint text is harmless ahead
// of that and becomes functional once those pieces land.
const TEMPLATES_BY_TIER = {
  [Tiers.STALE]: {
    title: 'Inactive Project',
    body: (name, daysSilent) => `🟡 '${name}' has been quiet for ${daysSilent} days.`,
  },
  [Tiers.VERY_STALE]: {
    title: 'Project Very Inactive',
    body: (name, daysSilent) =>
      `🔴 '${name}' has been quiet for ${daysSilent} days. Reply 'snooze ${name} <duration>' ` +
      'to mute these, or react 😴 to snooze.',
  },
};

// Same pattern as the card links already built for due-date reminders (see
// due-date-reminder-templates.js): {BASE_URL}/projects/:id, per
// client/src/constants/Paths.js.
const buildProjectUrl = (project) => `${sails.config.custom.baseUrl}/projects/${project.id}`;

// { title, linkTitle, url, body, color, discordFields, bodyByFormat }.
// `bodyByFormat` (text/markdown/html) matches the shape
// sails.helpers.utils.sendNotifications already expects (Apprise) — each
// includes a trailing link, since Apprise targets render as plain messages
// with no separate "link" concept.
// `linkTitle` + `url` + `body` + `color` + `discordFields` are for the
// notification-dispatch shared helper's Discord path: it builds a native
// embed (project name as the linked title, tier message as the description,
// last-activity as a field) — Discord-only because discordFields uses
// Discord's own <t:unix:F> timestamp markup (auto-localizes per viewer),
// which would show as literal text anywhere else.
const buildProjectNudgeMessage = ({ project, tier, daysSilent }) => {
  const template = TEMPLATES_BY_TIER[tier];

  const url = buildProjectUrl(project);
  const body = template.body(project.name, daysSilent);

  const lastActivityUnixSeconds = Math.floor(new Date(project.lastActivityAt).getTime() / 1000);

  const discordFields = [
    {
      name: 'Quiet Since',
      value: `<t:${lastActivityUnixSeconds}:F> (<t:${lastActivityUnixSeconds}:R>)`,
    },
  ];

  return {
    title: template.title,
    linkTitle: project.name,
    url,
    body,
    color: COLOR_BY_TIER[tier],
    discordFields,
    bodyByFormat: {
      text: `${body}\n\nView project: ${url}`,
      markdown: `${template.body(escapeMarkdown(project.name), daysSilent)}\n\n[View project](${url})`,
      // Link text is the URL itself, not a label like "View project": Apprise
      // downgrades html -> text for any target that doesn't declare HTML
      // support (common — e.g. most push-style services), and its converter
      // drops the <a> tag's href entirely, keeping only the visible text. A
      // label would vanish the link outright; the URL as link text survives
      // as plain, still-usable text either way.
      html: `${template.body(escapeHtml(project.name), daysSilent)}<br /><br /><a href="${url}">${url}</a>`,
    },
  };
};

module.exports = {
  Tiers,
  buildProjectNudgeMessage,
};
