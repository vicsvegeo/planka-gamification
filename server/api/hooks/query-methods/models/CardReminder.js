/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const defaultFind = (criteria) => CardReminder.find(criteria).sort('id');

/* Query methods */

const createOne = (values) => CardReminder.create({ ...values }).fetch();

const getByIds = (ids) => defaultFind(ids);

const getByCardId = (cardId) => defaultFind({ cardId });

const getByCardIds = (cardIds) =>
  defaultFind({
    cardId: cardIds,
  });

module.exports = {
  createOne,
  getByIds,
  getByCardId,
  getByCardIds,
};
