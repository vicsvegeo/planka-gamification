/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import http from './http';

/* Actions */

const getGithubRepositories = (headers) => http.get('/github/repositories', undefined, headers);

const getGithubBranches = (repo, headers) =>
  http.get(`/github/branches?repo=${encodeURIComponent(repo)}`, undefined, headers);

export default {
  getGithubRepositories,
  getGithubBranches,
};
