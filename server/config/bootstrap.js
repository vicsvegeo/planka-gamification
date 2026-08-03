/**
 * Seed Function
 * (sails.config.bootstrap)
 *
 * A function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also create a hook.
 *
 * For more information on seeding your app with fake data, check out:
 * https://sailsjs.com/config/bootstrap
 */

const { BADGES } = require('../utils/badges');

module.exports.bootstrap = async () => {
  // Gamification: keep the badge catalog in sync with the in-code registry on every
  // boot. Upsert by slug so re-running this never duplicates rows or clobbers unlocks.
  await Promise.all(
    BADGES.map(async (definition) => {
      const existingBadge = await Badge.qm.getOneBySlug(definition.slug);

      const values = {
        name: definition.name,
        description: definition.description,
        icon: definition.icon,
      };

      if (existingBadge) {
        await Badge.qm.updateOne({ id: existingBadge.id }, values);
      } else {
        try {
          await Badge.qm.createOne({ ...values, slug: definition.slug });
        } catch (error) {
          if (error.code !== 'E_UNIQUE') {
            throw error;
          }
        }
      }
    }),
  );
};
