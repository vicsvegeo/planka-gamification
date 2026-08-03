/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

export const selectGamificationStats = ({ gamification }) => gamification;

export const selectGamificationBadges = ({ gamification: { badges } }) => badges;

export default {
  selectGamificationStats,
  selectGamificationBadges,
};
