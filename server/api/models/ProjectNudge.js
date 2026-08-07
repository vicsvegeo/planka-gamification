/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * ProjectNudge.js
 *
 * @description :: One row per project inactivity nudge cycle actually sent.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 'project_nudges',

  attributes: {
    sentAt: {
      type: 'ref',
      columnName: 'sent_at',
      required: true,
    },

    // Relations
    projectId: {
      model: 'Project',
      columnName: 'project_id',
    },
  },
};
