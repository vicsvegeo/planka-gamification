/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import ActionTypes from '../constants/ActionTypes';

const fetchGamificationStats = () => ({
  type: ActionTypes.GAMIFICATION_STATS_FETCH,
  payload: {},
});

fetchGamificationStats.success = (stats, badges) => ({
  type: ActionTypes.GAMIFICATION_STATS_FETCH__SUCCESS,
  payload: {
    stats,
    badges,
  },
});

fetchGamificationStats.failure = (error) => ({
  type: ActionTypes.GAMIFICATION_STATS_FETCH__FAILURE,
  payload: {
    error,
  },
});

const handleGamificationEvent = (event) => ({
  type: ActionTypes.GAMIFICATION_EVENT_HANDLE,
  payload: {
    event,
  },
});

export default {
  fetchGamificationStats,
  handleGamificationEvent,
};
