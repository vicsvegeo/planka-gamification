/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const defaultFind = (criteria) => Badge.find(criteria).sort('id');

/* Query methods */

const createOne = (values) => Badge.create({ ...values }).fetch();

const getAll = () => defaultFind({});

const getByIds = (ids) => defaultFind(ids);

const getOneBySlug = (slug) => Badge.findOne({ slug });

const updateOne = (criteria, values) => Badge.updateOne(criteria).set({ ...values });

module.exports = {
  createOne,
  getAll,
  getByIds,
  getOneBySlug,
  updateOne,
};
