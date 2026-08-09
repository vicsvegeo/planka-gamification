/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// On-time completions are worth a flat percentage of the card's base XP, awarded once.
const ON_TIME_BONUS_RATIO = 0.4;

// Overdue completions (based on dueDate, not softDueDate) decay the base XP by 10% per
// full day late, compounding; past the hard cutoff the base XP is zeroed out rather than
// continuing the curve.
const OVERDUE_DECAY_RATIO = 0.9;
const OVERDUE_HARD_CUTOFF_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

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

// Whole days elapsed past dueDate, floored; 0 if not overdue (or no dueDate at all). Any
// positive lateness counts as at least 1 day overdue so the decay always kicks in once late.
const getDaysOverdue = (completedAt, dueDate) => {
  if (!dueDate) {
    return 0;
  }

  const diffMs = new Date(completedAt).getTime() - new Date(dueDate).getTime();

  if (diffMs <= 0) {
    return 0;
  }

  return Math.max(1, Math.floor(diffMs / MS_PER_DAY));
};

const computeOverdueXp = (baseXp, overdueDays) => {
  if (overdueDays <= 0) {
    return baseXp;
  }

  if (overdueDays >= OVERDUE_HARD_CUTOFF_DAYS) {
    return 0;
  }

  return Math.round(baseXp * OVERDUE_DECAY_RATIO ** overdueDays);
};

module.exports = {
  ON_TIME_BONUS_RATIO,
  OVERDUE_DECAY_RATIO,
  OVERDUE_HARD_CUTOFF_DAYS,
  xpForLevel,
  levelForXp,
  computeOnTimeBonus,
  isOnTime,
  getDaysOverdue,
  computeOverdueXp,
};
