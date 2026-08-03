/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const defaultFind = (criteria) => BadgeUnlock.find(criteria).sort('id');

/* Query methods */

const createOne = (values) => BadgeUnlock.create({ ...values }).fetch();

const getByIds = (ids) => defaultFind(ids);

const getByUserId = (userId) => defaultFind({ userId });

const getOneByUserIdAndBadgeId = (userId, badgeId) => BadgeUnlock.findOne({ userId, badgeId });

module.exports = {
  createOne,
  getByIds,
  getByUserId,
  getOneByUserIdAndBadgeId,
};
