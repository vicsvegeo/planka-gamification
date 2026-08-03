/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { call, put } from 'redux-saga/effects';
import toast from 'react-hot-toast';

import request from '../request';
import actions from '../../../actions';
import api from '../../../api';
import ToastTypes from '../../../constants/ToastTypes';

export function* fetchGamificationStats() {
  let stats;
  let badges;
  try {
    ({
      item: stats,
      included: { badges },
    } = yield call(request, api.getUserGamificationStats, 'me'));
  } catch (error) {
    yield put(actions.fetchGamificationStats.failure(error));
    return;
  }

  yield put(actions.fetchGamificationStats.success(stats, badges));
}

export function* handleGamificationEvent(event) {
  yield put(actions.handleGamificationEvent(event));

  switch (event.kind) {
    case 'levelUp':
      yield call(toast, {
        type: ToastTypes.LEVEL_UP,
        params: {
          level: event.level,
        },
      });

      break;
    case 'badgeUnlocked':
      yield call(toast, {
        type: ToastTypes.BADGE_UNLOCKED,
        params: {
          badge: event.badge,
        },
      });

      break;
    default:
  }

  yield call(fetchGamificationStats);
}

export default {
  fetchGamificationStats,
  handleGamificationEvent,
};
