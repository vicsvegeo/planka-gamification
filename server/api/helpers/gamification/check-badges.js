/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { BADGES } = require('../../../utils/badges');

module.exports = {
  inputs: {
    userId: {
      type: 'string',
      required: true,
    },
    context: {
      type: 'json',
      required: true,
    },
  },

  async fn(inputs) {
    const [badgeRecords, unlocks] = await Promise.all([
      Badge.qm.getAll(),
      BadgeUnlock.qm.getByUserId(inputs.userId),
    ]);

    const badgeRecordBySlug = _.keyBy(badgeRecords, 'slug');
    const unlockedBadgeIds = new Set(unlocks.map((unlock) => unlock.badgeId));

    const newlyUnlocked = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const definition of BADGES) {
      const badgeRecord = badgeRecordBySlug[definition.slug];

      if (
        badgeRecord &&
        !unlockedBadgeIds.has(badgeRecord.id) &&
        definition.check(inputs.context)
      ) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await BadgeUnlock.qm.createOne({
            userId: inputs.userId,
            badgeId: badgeRecord.id,
            unlockedAt: new Date().toISOString(),
          });

          newlyUnlocked.push(badgeRecord);
        } catch (error) {
          if (error.code !== 'E_UNIQUE') {
            throw error;
          }
        }
      }
    }

    return newlyUnlocked;
  },
};
