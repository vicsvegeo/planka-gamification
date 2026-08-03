/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// Merges each card's XP value / soft due date / bonus flag onto the (plain, mutable)
// card record(s) so API responses carry them alongside the rest of the card fields.
module.exports = {
  inputs: {
    // `ref` (not `json`) is required here — this helper mutates the card records that
    // were passed in, and `json`-typed inputs get cloned by the machine runner, which
    // would silently discard the mutations before the caller ever sees them.
    cards: {
      type: 'ref',
      required: true,
    },
  },

  async fn(inputs) {
    const cards = _.castArray(inputs.cards);

    if (cards.length === 0) {
      return;
    }

    const cardIds = sails.helpers.utils.mapRecords(cards);
    const cardGamifications = await CardGamification.qm.getByCardIds(cardIds);
    const cardGamificationByCardId = _.keyBy(cardGamifications, 'cardId');

    cards.forEach((card) => {
      const cardGamification = cardGamificationByCardId[card.id];

      // eslint-disable-next-line no-param-reassign
      card.baseXp = cardGamification ? cardGamification.baseXp : null;
      // eslint-disable-next-line no-param-reassign
      card.softDueDate = cardGamification ? cardGamification.softDueDate : null;
      // eslint-disable-next-line no-param-reassign
      card.bonusAwarded = cardGamification ? cardGamification.bonusAwarded : false;
    });
  },
};
