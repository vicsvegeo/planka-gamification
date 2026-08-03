/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * UserStats.js
 *
 * @description :: Per-user gamification totals (XP, level, completion counters).
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 'user_stats',

  attributes: {
    xp: {
      type: 'number',
      defaultsTo: 0,
    },
    level: {
      type: 'number',
      defaultsTo: 1,
    },
    onTimeCompletions: {
      type: 'number',
      columnName: 'on_time_completions',
      defaultsTo: 0,
    },
    totalCompletions: {
      type: 'number',
      columnName: 'total_completions',
      defaultsTo: 0,
    },

    // Relations
    userId: {
      model: 'User',
      columnName: 'user_id',
    },
  },
};
