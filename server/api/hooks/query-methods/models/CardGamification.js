/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const defaultFind = (criteria) => CardGamification.find(criteria).sort('id');

/* Query methods */

const createOne = (values) => CardGamification.create({ ...values }).fetch();

const getByIds = (ids) => defaultFind(ids);

const getOneByCardId = (cardId) => CardGamification.findOne({ cardId });

const getByCardIds = (cardIds) => defaultFind({ cardId: cardIds });

const updateOne = (criteria, values) => CardGamification.updateOne(criteria).set({ ...values });

// eslint-disable-next-line no-underscore-dangle
const delete_ = (criteria) => CardGamification.destroy(criteria).fetch();

const deleteOne = (criteria) => CardGamification.destroyOne(criteria);

module.exports = {
  createOne,
  getByIds,
  getOneByCardId,
  getByCardIds,
  updateOne,
  deleteOne,
  delete: delete_,
};
