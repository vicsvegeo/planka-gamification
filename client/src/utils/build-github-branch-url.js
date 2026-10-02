/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const buildGithubBranchUrl = (repo, branch) =>
  `https://github.com/${repo}/tree/${branch.split('/').map(encodeURIComponent).join('/')}`;

export default buildGithubBranchUrl;
