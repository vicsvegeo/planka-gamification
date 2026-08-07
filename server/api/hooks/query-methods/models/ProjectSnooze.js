/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const defaultFind = (criteria) => ProjectSnooze.find(criteria).sort('id');

/* Query methods */

const createOne = (values) => ProjectSnooze.create({ ...values }).fetch();

const getByIds = (ids) => defaultFind(ids);

const getByProjectId = (projectId) => defaultFind({ projectId });

const getByProjectIdsAndUserId = (projectIds, userId) =>
  defaultFind({
    userId,
    projectId: projectIds,
  });

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

// eslint-disable-next-line no-underscore-dangle
const delete_ = (criteria) => ProjectSnooze.destroy(criteria).fetch();

const deleteOne = (criteria) => ProjectSnooze.destroyOne(criteria);

module.exports = {
  createOne,
  getByIds,
  getByProjectId,
  getByProjectIdsAndUserId,
  getOneByProjectIdAndUserId,
  updateOne,
  upsertOneByProjectIdAndUserId,
  isSnoozed,
  deleteOne,
  delete: delete_,
};
