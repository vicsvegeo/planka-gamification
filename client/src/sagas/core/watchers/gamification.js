/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { all, takeEvery } from 'redux-saga/effects';

import services from '../services';
import EntryActionTypes from '../../../constants/EntryActionTypes';

export default function* gamificationWatchers() {
  yield all([
    takeEvery(EntryActionTypes.GAMIFICATION_STATS_FETCH, () => services.fetchGamificationStats()),
    takeEvery(EntryActionTypes.GAMIFICATION_EVENT_HANDLE, ({ payload: { event } }) =>
      services.handleGamificationEvent(event),
    ),
  ]);
}
