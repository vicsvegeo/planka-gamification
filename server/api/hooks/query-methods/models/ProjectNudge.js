/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const defaultFind = (criteria) => ProjectNudge.find(criteria).sort('id');

/* Query methods */

const createOne = (values) => ProjectNudge.create({ ...values }).fetch();

const getByIds = (ids) => defaultFind(ids);

const getByProjectId = (projectId) => defaultFind({ projectId });

const getByProjectIds = (projectIds) =>
  defaultFind({
    projectId: projectIds,
  });

module.exports = {
  createOne,
  getByIds,
  getByProjectId,
  getByProjectIds,
};
