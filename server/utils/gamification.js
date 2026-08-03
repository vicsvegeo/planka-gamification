/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// On-time completions are worth a flat percentage of the card's base XP, awarded once.
const ON_TIME_BONUS_RATIO = 0.4;

// XP required to advance from `level` to `level + 1`. Early levels come fast, later ones slow down.
const xpForLevel = (level) => Math.round(100 * level ** 1.5);

// Given a lifetime XP total, resolve the current level and progress towards the next one.
const levelForXp = (xp) => {
  let level = 1;
  let remaining = xp;

  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level += 1;
  }

  return {
    level,
    xpIntoLevel: remaining,
    xpForNextLevel: xpForLevel(level),
  };
};

const computeOnTimeBonus = (baseXp) => Math.round(baseXp * ON_TIME_BONUS_RATIO);

const isOnTime = (completedAt, softDueDate) =>
  !!softDueDate && new Date(completedAt).getTime() <= new Date(softDueDate).getTime();

module.exports = {
  ON_TIME_BONUS_RATIO,
  xpForLevel,
  levelForXp,
  computeOnTimeBonus,
  isOnTime,
};
