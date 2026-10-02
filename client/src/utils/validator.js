/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import isURL from 'validator/lib/isURL';
import zxcvbn from 'zxcvbn';

const USERNAME_REGEX = /^[a-zA-Z0-9]+((_|\.)?[a-zA-Z0-9])*$/;

export const isUrl = (string) =>
  isURL(string, {
    protocols: ['http', 'https'],
    require_tld: false,
    require_protocol: true,
    max_allowed_length: 2048,
  });

export const isPassword = (string) => zxcvbn(string).score >= 2; // TODO: move to config

export const isUsername = (string) =>
  string.length >= 3 && string.length <= 32 && USERNAME_REGEX.test(string);

// Keep in sync with server/utils/github-branches.js.
export const isGithubRepo = (string) => /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(string);

export const isGithubBranchName = (string) =>
  string.length <= 255 &&
  /^(?!\/|.*(?:\/\/|\.\.|@\{|\/$|\.$|\.lock$))[A-Za-z0-9._/-]+$/.test(string);
