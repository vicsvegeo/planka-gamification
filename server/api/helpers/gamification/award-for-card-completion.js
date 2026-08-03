/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { levelForXp, computeOnTimeBonus, isOnTime } = require('../../../utils/gamification');

// Fires once, exactly at the moment a card transitions into a closed list. Awards XP
// (plus a one-time on-time bonus), recomputes the completer's level, runs the badge
// engine, and broadcasts lightweight socket events for the client to toast off of.
module.exports = {
  inputs: {
    card: {
      type: 'ref',
      required: true,
    },
    previousList: {
      type: 'ref',
      required: true,
    },
    actorUser: {
      type: 'ref',
      required: true,
    },
  },

  async fn(inputs) {
    const { card, previousList, actorUser } = inputs;

    const cardGamification = await CardGamification.qm.getOneByCardId(card.id);

    // Cards created before this feature shipped may not have a gamification row.
    if (!cardGamification || cardGamification.xpAwarded) {
      return;
    }

    const completedAt = new Date().toISOString();
    const onTime = isOnTime(completedAt, cardGamification.softDueDate);
    const bonusXp = onTime ? computeOnTimeBonus(cardGamification.baseXp) : 0;
    const xpGained = cardGamification.baseXp + bonusXp;

    await CardGamification.qm.updateOne(cardGamification.id, {
      xpAwarded: true,
      bonusAwarded: cardGamification.bonusAwarded || onTime,
    });

    const userStatsBefore = await UserStats.qm.getOrCreateOneByUserId(actorUser.id);
    const nextXp = userStatsBefore.xp + xpGained;
    const { level: nextLevel } = levelForXp(nextXp);
    const leveledUp = nextLevel > userStatsBefore.level;

    const userStats = await UserStats.qm.updateOne(userStatsBefore.id, {
      xp: nextXp,
      level: nextLevel,
      totalCompletions: userStatsBefore.totalCompletions + 1,
      onTimeCompletions: userStatsBefore.onTimeCompletions + (onTime ? 1 : 0),
    });

    // "Clean Sweep": this move emptied out the list the card left, e.g. clearing a To Do list.
    const remainingInPreviousList =
      previousList.id === card.listId ? [] : await Card.qm.getByListId(previousList.id);

    const listCleared = previousList.id !== card.listId && remainingInPreviousList.length === 0;

    const newlyUnlockedBadges = await sails.helpers.gamification.checkBadges.with({
      userId: actorUser.id,
      context: {
        userStats: _.pick(userStats, ['xp', 'level', 'totalCompletions', 'onTimeCompletions']),
        listCleared,
      },
    });

    sails.sockets.broadcast(`user:${actorUser.id}`, 'gamificationEvent', {
      item: {
        kind: 'statsUpdate',
        xpGained,
        onTime,
        stats: _.pick(userStats, ['xp', 'level', 'totalCompletions', 'onTimeCompletions']),
      },
    });

    if (leveledUp) {
      sails.sockets.broadcast(`user:${actorUser.id}`, 'gamificationEvent', {
        item: {
          kind: 'levelUp',
          level: nextLevel,
        },
      });
    }

    newlyUnlockedBadges.forEach((badge) => {
      sails.sockets.broadcast(`user:${actorUser.id}`, 'gamificationEvent', {
        item: {
          kind: 'badgeUnlocked',
          badge: _.pick(badge, ['slug', 'name', 'description', 'icon']),
        },
      });
    });
  },
};
