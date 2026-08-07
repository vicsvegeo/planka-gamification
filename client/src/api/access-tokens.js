/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import http from './http';
import getTimezone from '../utils/timezone';

/* Actions */

const withTimezone = (data) => {
  const timezone = getTimezone();
  return timezone ? { ...data, timezone } : data;
};

const createAccessToken = (data, headers) =>
  http.post('/access-tokens?withHttpOnlyToken=true', withTimezone(data), headers);

const exchangeForAccessTokenWithOidc = (data, headers) =>
  http.post(
    '/access-tokens/exchange-with-oidc?withHttpOnlyToken=true',
    withTimezone(data),
    headers,
  );

const debugOidc = (data, headers) => http.post('/access-tokens/debug-oidc', data, headers);

// TODO: rename?
const acceptTerms = (data, headers) =>
  http.post('/access-tokens/accept-terms', withTimezone(data), headers);

const revokePendingToken = (data, headers) =>
  http.post('/access-tokens/revoke-pending-token', data, headers);

const deleteCurrentAccessToken = (headers) => http.delete('/access-tokens/me', undefined, headers);

export default {
  createAccessToken,
  exchangeForAccessTokenWithOidc,
  debugOidc,
  acceptTerms,
  revokePendingToken,
  deleteCurrentAccessToken,
};
