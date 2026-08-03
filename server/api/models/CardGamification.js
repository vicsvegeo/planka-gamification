module.exports = {
  tableName: 'card_gamification',

  attributes: {
    baseXp: {
      type: 'number',
      columnName: 'base_xp',
      required: true,
    },
    softDueDate: {
      type: 'ref',
      columnType: 'timestamp',
      columnName: 'soft_due_date',
    },
    bonusAwarded: {
      type: 'boolean',
      columnName: 'bonus_awarded',
      defaultsTo: false,
    },
    xpAwarded: {
      type: 'boolean',
      columnName: 'xp_awarded',
      defaultsTo: false,
    },

    // Relations
    cardId: {
      model: 'Card',
      columnName: 'card_id',
    },
  },
};
