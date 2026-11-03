/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import ActionTypes from '../../constants/ActionTypes';
import { ProjectTypes } from '../../constants/Enums';

const initialState = {
  data: {
    name: '',
    description: '',
    type: ProjectTypes.PRIVATE,
    ticketPrefix: '',
  },
  isSubmitting: false,
  error: null,
};

// eslint-disable-next-line default-param-last
export default (state = initialState, { type, payload }) => {
  switch (type) {
    case ActionTypes.PROJECT_CREATE:
      return {
        ...state,
        data: {
          ...state.data,
          ...payload.data,
        },
        isSubmitting: true,
        error: null,
      };
    case ActionTypes.PROJECT_CREATE__SUCCESS:
      return initialState;
    case ActionTypes.PROJECT_CREATE__FAILURE:
      return {
        ...state,
        isSubmitting: false,
        error: payload.error,
      };
    default:
      return state;
  }
};
