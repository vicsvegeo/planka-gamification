/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// Builds the "card context" block synced into PR descriptions: the card's
// Why and Done when sections between marker comments.

const START_MARKER = '<!-- planka:card-context:start -->';
const END_MARKER = '<!-- planka:card-context:end -->';

const BLOCK_REGEX = /<!-- planka:card-context:start -->[\s\S]*?<!-- planka:card-context:end -->/;

// A section heading is a markdown heading (`## Why`) or a line that is only bold
// text (`**Why**`, `__Why:__`), the style used in card descriptions.
const HEADING_REGEX = /^\s*(?:#{1,6}\s+(.+?)\s*#*|(\*\*|__)(.+?)\2)\s*$/;

const normalizeHeading = (text) => text.replace(/[\s:]+$/, '').toLowerCase();

const SECTION_KEYS = {
  why: 'why',
  'done when': 'doneWhen',
};

const extractSections = (description) => {
  const sections = {};

  if (!description) {
    return sections;
  }

  let currentKey = null;
  let lines = [];

  const flush = () => {
    if (currentKey && !sections[currentKey]) {
      const content = lines.join('\n').trim();

      if (content) {
        sections[currentKey] = content;
      }
    }
  };

  description.split(/\r?\n/).forEach((line) => {
    const match = line.match(HEADING_REGEX);

    if (match) {
      flush();

      currentKey = SECTION_KEYS[normalizeHeading(match[1] || match[3])] || null;
      lines = [];

      return;
    }

    if (currentKey) {
      lines.push(line);
    }
  });

  flush();

  return sections;
};

const buildBlock = ({ ticketKey, cardName, cardUrl, description }) => {
  const { why, doneWhen } = extractSections(description);

  const parts = [
    START_MARKER,
    `### ${ticketKey}: ${cardName}`,
    '',
    `_Synced from the [Planka card](${cardUrl}) when this PR was opened. Edits outside this block are kept._`,
  ];

  if (!why && !doneWhen) {
    parts.push(
      '',
      `> [!NOTE]`,
      `> The card has no **Why** or **Done when** section, so there is no context to show. ` +
        'Add them to the card description and reopen the PR to sync again.',
    );
  } else {
    parts.push('', '#### Why', '', why || '_The card has no Why section._');
    parts.push('', '#### Done when', '', doneWhen || '_The card has no Done when section._');
  }

  parts.push(END_MARKER);

  return parts.join('\n');
};

// Replaces an existing block in place, or puts the block above the body.
const mergeIntoBody = (body, block) => {
  if (body && BLOCK_REGEX.test(body)) {
    return body.replace(BLOCK_REGEX, () => block);
  }

  return body && body.trim() ? `${block}\n\n${body}` : block;
};

module.exports = {
  START_MARKER,
  END_MARKER,
  extractSections,
  buildBlock,
  mergeIntoBody,
};
