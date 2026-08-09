/*!
 * Fork addition — mirrors ProjectSnooze's query methods exactly, scoped to a
 * card instead of a project.
 */

const defaultFind = (criteria) => CardSnooze.find(criteria).sort('id');

/* Query methods */

const createOne = (values) => CardSnooze.create({ ...values }).fetch();

const getByIds = (ids) => defaultFind(ids);

const getByCardId = (cardId) => defaultFind({ cardId });

const getByCardIdsAndUserId = (cardIds, userId) =>
  defaultFind({
    userId,
    cardId: cardIds,
  });

const getOneByCardIdAndUserId = (cardId, userId) => CardSnooze.findOne({ cardId, userId });

const updateOne = (criteria, values) => CardSnooze.updateOne(criteria).set({ ...values });

const upsertOneByCardIdAndUserId = async (cardId, userId, snoozedUntil) => {
  try {
    return await createOne({ cardId, userId, snoozedUntil });
  } catch (error) {
    if (error.code !== 'E_UNIQUE') {
      throw error;
    }

    return updateOne({ cardId, userId }, { snoozedUntil });
  }
};

const isSnoozed = async (cardId, userId) => {
  const cardSnooze = await CardSnooze.findOne({
    cardId,
    userId,
    snoozedUntil: { '>': new Date().toISOString() },
  });

  return !!cardSnooze;
};

// eslint-disable-next-line no-underscore-dangle
const delete_ = (criteria) => CardSnooze.destroy(criteria).fetch();

const deleteOne = (criteria) => CardSnooze.destroyOne(criteria);

module.exports = {
  createOne,
  getByIds,
  getByCardId,
  getByCardIdsAndUserId,
  getOneByCardIdAndUserId,
  updateOne,
  upsertOneByCardIdAndUserId,
  isSnoozed,
  deleteOne,
  delete: delete_,
};
