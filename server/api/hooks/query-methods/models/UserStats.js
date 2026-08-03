/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const defaultFind = (criteria) => UserStats.find(criteria).sort('id');

/* Query methods */

const createOne = (values) => UserStats.create({ ...values }).fetch();

const getByIds = (ids) => defaultFind(ids);

const getByUserIds = (userIds) => defaultFind({ userId: userIds });

const getOneByUserId = (userId) => UserStats.findOne({ userId });

const updateOne = (criteria, values) => UserStats.updateOne(criteria).set({ ...values });

const getOrCreateOneByUserId = async (userId) => {
  let userStats = await getOneByUserId(userId);

  if (!userStats) {
    try {
      userStats = await createOne({ userId });
    } catch (error) {
      if (error.code !== 'E_UNIQUE') {
        throw error;
      }

      userStats = await getOneByUserId(userId);
    }
  }

  return userStats;
};

module.exports = {
  createOne,
  getByIds,
  getByUserIds,
  getOneByUserId,
  getOrCreateOneByUserId,
  updateOne,
};
