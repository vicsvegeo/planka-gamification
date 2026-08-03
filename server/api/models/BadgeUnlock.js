/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * BadgeUnlock.js
 *
 * @description :: One row per (user, badge) the first time it's earned.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 'badge_unlock',

  attributes: {
    unlockedAt: {
      type: 'ref',
      columnName: 'unlocked_at',
      required: true,
    },

    // Relations
    userId: {
      model: 'User',
      columnName: 'user_id',
    },
    badgeId: {
      model: 'Badge',
      columnName: 'badge_id',
    },
  },
};
