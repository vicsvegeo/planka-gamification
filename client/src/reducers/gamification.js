/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import ActionTypes from '../constants/ActionTypes';

const initialState = {
  isFetched: false,
  xp: 0,
  level: 1,
  xpIntoLevel: 0,
  xpForNextLevel: 100,
  totalCompletions: 0,
  onTimeCompletions: 0,
  onTimeRate: 0,
  badges: [],
};

// eslint-disable-next-line default-param-last
export default (state = initialState, { type, payload }) => {
  switch (type) {
    case ActionTypes.GAMIFICATION_STATS_FETCH__SUCCESS:
      return {
        ...state,
        isFetched: true,
        ...payload.stats,
        badges: payload.badges,
      };
    default:
      return state;
  }
};
