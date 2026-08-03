/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /users/{id}/gamification-stats:
 *   get:
 *     summary: Get user gamification stats
 *     description: Retrieves a user's XP, level, and badge progress. Use 'me' as ID to get the current user.
 *     tags:
 *       - Users
 *     operationId: getUserGamificationStats
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the user or 'me' for current user
 *         schema:
 *           type: string
 *           example: "1357158568008091264"
 *     responses:
 *       200:
 *         description: User gamification stats retrieved successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

const { ID_REGEX, MAX_STRING_ID, isIdInRange } = require('../../../utils/validators');
const { levelForXp } = require('../../../utils/gamification');

const Errors = {
  USER_NOT_FOUND: {
    userNotFound: 'User not found',
  },
};

const CURRENT_USER_ID = 'me';

const ID_OR_CURRENT_USER_ID_REGEX = new RegExp(`${ID_REGEX.source}|^${CURRENT_USER_ID}$`);

const isCurrentUserIdOrIdInRange = (value) => value === CURRENT_USER_ID || isIdInRange(value);

module.exports = {
  inputs: {
    id: {
      type: 'string',
      maxLength: MAX_STRING_ID.length,
      regex: ID_OR_CURRENT_USER_ID_REGEX,
      custom: isCurrentUserIdOrIdInRange,
      required: true,
    },
  },

  exits: {
    userNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    const userId = inputs.id === CURRENT_USER_ID ? currentUser.id : inputs.id;

    let user;
    if (userId === currentUser.id) {
      user = currentUser;
    } else {
      user = await User.qm.getOneById(userId);

      if (!user) {
        throw Errors.USER_NOT_FOUND;
      }
    }

    const [userStats, badges, unlocks] = await Promise.all([
      UserStats.qm.getOrCreateOneByUserId(user.id),
      Badge.qm.getAll(),
      BadgeUnlock.qm.getByUserId(user.id),
    ]);

    const unlockedAtByBadgeId = _.keyBy(unlocks, 'badgeId');
    const { level, xpIntoLevel, xpForNextLevel } = levelForXp(userStats.xp);

    return {
      item: {
        userId: user.id,
        xp: userStats.xp,
        level,
        xpIntoLevel,
        xpForNextLevel,
        totalCompletions: userStats.totalCompletions,
        onTimeCompletions: userStats.onTimeCompletions,
        onTimeRate:
          userStats.totalCompletions > 0
            ? userStats.onTimeCompletions / userStats.totalCompletions
            : 0,
      },
      included: {
        badges: badges.map((badge) => ({
          id: badge.id,
          slug: badge.slug,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          unlockedAt: unlockedAtByBadgeId[badge.id]
            ? unlockedAtByBadgeId[badge.id].unlockedAt
            : null,
        })),
      },
    };
  },
};
