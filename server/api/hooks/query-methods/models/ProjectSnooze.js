/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const defaultFind = (criteria) => ProjectSnooze.find(criteria).sort('id');

/* Query methods */

const createOne = (values) => ProjectSnooze.create({ ...values }).fetch();

const getByIds = (ids) => defaultFind(ids);

const getByProjectId = (projectId) => defaultFind({ projectId });

const getOneByProjectIdAndUserId = (projectId, userId) =>
  ProjectSnooze.findOne({ projectId, userId });

const updateOne = (criteria, values) => ProjectSnooze.updateOne(criteria).set({ ...values });

const upsertOneByProjectIdAndUserId = async (projectId, userId, snoozedUntil) => {
  try {
    return await createOne({ projectId, userId, snoozedUntil });
  } catch (error) {
    if (error.code !== 'E_UNIQUE') {
      throw error;
    }

    return updateOne({ projectId, userId }, { snoozedUntil });
  }
};

const isSnoozed = async (projectId, userId) => {
  const projectSnooze = await ProjectSnooze.findOne({
    projectId,
    userId,
    snoozedUntil: { '>': new Date().toISOString() },
  });

  return !!projectSnooze;
};

module.exports = {
  createOne,
  getByIds,
  getByProjectId,
  getOneByProjectIdAndUserId,
  updateOne,
  upsertOneByProjectIdAndUserId,
  isSnoozed,
};
