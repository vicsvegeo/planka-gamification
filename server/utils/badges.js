/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// Starter badge catalog. Adding a new badge is just adding an entry here — the engine
// (see api/helpers/gamification/check-badges.js) evaluates every definition after each
// completion event and unlocks whichever ones aren't already unlocked for the user.
//
// `check(context)` receives:
//   - userStats: { xp, level, totalCompletions, onTimeCompletions }
//   - listCleared: true if the completed card was the last open card in its list
const BADGES = [
  {
    slug: 'first_blood',
    name: 'First Blood',
    description: 'Complete your first card',
    icon: '🩸',
    check: ({ userStats }) => userStats.totalCompletions >= 1,
  },
  {
    slug: 'getting_started',
    name: 'Getting Started',
    description: 'Complete 10 cards',
    icon: '🌱',
    check: ({ userStats }) => userStats.totalCompletions >= 10,
  },
  {
    slug: 'on_a_roll',
    name: 'On a Roll',
    description: 'Complete 50 cards',
    icon: '🔥',
    check: ({ userStats }) => userStats.totalCompletions >= 50,
  },
  {
    slug: 'punctual',
    name: 'Punctual',
    description: 'Hit 5 on-time bonuses',
    icon: '⏰',
    check: ({ userStats }) => userStats.onTimeCompletions >= 5,
  },
  {
    slug: 'level_5',
    name: 'Level 5',
    description: 'Reach level 5',
    icon: '⭐',
    check: ({ userStats }) => userStats.level >= 5,
  },
  {
    slug: 'level_10',
    name: 'Level 10',
    description: 'Reach level 10',
    icon: '🌟',
    check: ({ userStats }) => userStats.level >= 10,
  },
  {
    slug: 'clean_sweep',
    name: 'Clean Sweep',
    description: 'Clear an entire list in one sitting',
    icon: '🧹',
    check: (context) => context.listCleared,
  },
];

module.exports = {
  BADGES,
};
