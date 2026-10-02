/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { ProxyAgent } = require('undici');

const REQUEST_TIMEOUT = 10000;
const REPOSITORIES_PER_PAGE = 100;
const MAX_REPOSITORY_PAGES = 10;

class GithubError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'GithubError';
    this.status = status;
  }
}

const createGithubClient = ({ token, apiUrl, outgoingProxy }) => {
  const request = async (method, path, body) => {
    let response;
    try {
      response = await fetch(`${apiUrl}${path}`, {
        method,
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'User-Agent': 'planka',
          'X-GitHub-Api-Version': '2022-11-28',
          ...(body && { 'Content-Type': 'application/json' }),
        },
        body: body && JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
        dispatcher: outgoingProxy ? new ProxyAgent(outgoingProxy) : undefined,
      });
    } catch (error) {
      throw new GithubError(`Could not reach GitHub (${error.message})`);
    }

    let json = null;
    try {
      json = await response.json();
    } catch (error) {
      /* empty */
    }

    return { status: response.status, body: json };
  };

  const describeFailure = (status, repo) => {
    switch (status) {
      case 401:
        return 'GitHub rejected the token (expired or revoked?)';
      case 403:
        return `The GitHub token is not allowed to write to ${repo}`;
      case 404:
        return `Repository ${repo} not found, or the token has no access to it`;
      default:
        return `GitHub request failed with status ${status}`;
    }
  };

  // Creates `branch` from the tip of `baseBranch`. An existing branch is reused.
  const ensureBranch = async ({ repo, baseBranch, branch }) => {
    const base = await request('GET', `/repos/${repo}/git/ref/heads/${baseBranch}`);

    if (base.status === 404) {
      const repoCheck = await request('GET', `/repos/${repo}`);

      if (repoCheck.status === 200) {
        throw new GithubError(`Base branch ${baseBranch} does not exist in ${repo}`, 404);
      }

      throw new GithubError(describeFailure(repoCheck.status, repo), repoCheck.status);
    }

    if (base.status !== 200 || !base.body || !base.body.object) {
      throw new GithubError(describeFailure(base.status, repo), base.status);
    }

    const created = await request('POST', `/repos/${repo}/git/refs`, {
      ref: `refs/heads/${branch}`,
      sha: base.body.object.sha,
    });

    if (created.status === 201) {
      return { created: true };
    }

    // 422 usually means "Reference already exists": reuse it. It is also used for
    // invalid ref names, so confirm the branch is really there.
    if (created.status === 422) {
      const existing = await request('GET', `/repos/${repo}/git/ref/heads/${branch}`);

      if (existing.status === 200) {
        return { created: false };
      }

      const reason = created.body && created.body.message;
      throw new GithubError(
        `GitHub could not create ${branch}: ${reason || 'invalid branch'}`,
        422,
      );
    }

    throw new GithubError(describeFailure(created.status, repo), created.status);
  };

  const updatePullRequestBody = async ({ repo, number, body }) => {
    const updated = await request('PATCH', `/repos/${repo}/pulls/${number}`, { body });

    if (updated.status === 200) {
      return;
    }

    if (updated.status === 403) {
      throw new GithubError(
        `The GitHub token is not allowed to edit pull requests in ${repo} (needs Pull requests: read and write)`,
        403,
      );
    }

    throw new GithubError(describeFailure(updated.status, repo), updated.status);
  };

  // Repositories the token can access (for a fine-grained PAT: the selected ones).
  const listRepositories = async () => {
    const repositories = [];

    for (let page = 1; page <= MAX_REPOSITORY_PAGES; page += 1) {
      // eslint-disable-next-line no-await-in-loop
      const response = await request(
        'GET',
        `/user/repos?per_page=${REPOSITORIES_PER_PAGE}&page=${page}&sort=full_name`,
      );

      if (response.status !== 200 || !Array.isArray(response.body)) {
        throw new GithubError(
          response.status === 401
            ? describeFailure(401)
            : `Could not list repositories (GitHub status ${response.status})`,
          response.status,
        );
      }

      repositories.push(
        ...response.body.map((repository) => ({
          fullName: repository.full_name,
          defaultBranch: repository.default_branch,
          isPrivate: repository.private,
        })),
      );

      if (response.body.length < REPOSITORIES_PER_PAGE) {
        break;
      }
    }

    return repositories;
  };

  return { request, ensureBranch, updatePullRequestBody, listRepositories };
};

module.exports = {
  GithubError,
  createGithubClient,
};
