/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * ProjectSnooze.js
 *
 * @description :: One row per (project, user) currently silencing inactivity nudges for that user.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 'project_snooze',

  attributes: {
    snoozedUntil: {
      type: 'ref',
      columnName: 'snoozed_until',
      required: true,
    },

    // Relations
    projectId: {
      model: 'Project',
      columnName: 'project_id',
    },
    userId: {
      model: 'User',
      columnName: 'user_id',
    },
  },
};
