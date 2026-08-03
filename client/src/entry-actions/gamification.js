/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import EntryActionTypes from '../constants/EntryActionTypes';

const fetchGamificationStats = () => ({
  type: EntryActionTypes.GAMIFICATION_STATS_FETCH,
  payload: {},
});

const handleGamificationEvent = (event) => ({
  type: EntryActionTypes.GAMIFICATION_EVENT_HANDLE,
  payload: {
    event,
  },
});

export default {
  fetchGamificationStats,
  handleGamificationEvent,
};
