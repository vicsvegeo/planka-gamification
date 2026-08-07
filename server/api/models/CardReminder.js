/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * CardReminder.js
 *
 * @description :: One row per due-date reminder actually sent for a card.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 'card_reminders',

  attributes: {
    sentAt: {
      type: 'ref',
      columnName: 'sent_at',
      required: true,
    },

    // Relations
    cardId: {
      model: 'Card',
      columnName: 'card_id',
    },
  },
};
