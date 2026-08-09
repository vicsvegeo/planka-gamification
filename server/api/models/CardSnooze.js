/*!
 * Fork addition — mirrors ProjectSnooze exactly, scoped to a card instead of
 * a project. A fully separate mechanism from project_snooze.
 */

/**
 * CardSnooze.js
 *
 * @description :: One row per (card, user) currently silencing due-date reminders for that user.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 'card_snooze',

  attributes: {
    snoozedUntil: {
      type: 'ref',
      columnName: 'snoozed_until',
      required: true,
    },

    // Relations
    cardId: {
      model: 'Card',
      columnName: 'card_id',
    },
    userId: {
      model: 'User',
      columnName: 'user_id',
    },
  },
};
