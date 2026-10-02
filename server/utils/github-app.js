/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// GitHub App authentication. The app signs a short-lived JWT with its private
// key, exchanges it for an installation token per installation (an account or
// organisation the app is installed on), and uses that token for repo calls.
// Installation tokens live for an hour and are cached until shortly before.

const crypto = require('crypto');

const { GithubError, createGithubClient } = require('./github-api');

const JWT_LIFETIME = 9 * 60; // GitHub allows at most 10 minutes.
const JWT_CLOCK_DRIFT = 60;
const TOKEN_REFRESH_MARGIN = 5 * 60 * 1000;
const INSTALLATION_CACHE_TTL = 10 * 60 * 1000;
const REPOSITORIES_PER_PAGE = 100;
const MAX_REPOSITORY_PAGES = 10;

const base64Url = (value) => Buffer.from(value).toString('base64url');

const createAppJwt = (appId, privateKey, now = Math.floor(Date.now() / 1000)) => {
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(
    JSON.stringify({
      iat: now - JWT_CLOCK_DRIFT,
      exp: now + JWT_LIFETIME,
      iss: String(appId),
    }),
  );

  const signature = crypto
    .createSign('RSA-SHA256')
    .update(`${header}.${payload}`)
    .sign(privateKey, 'base64url');

  return `${header}.${payload}.${signature}`;
};

const createGithubApp = ({ appId, privateKey, apiUrl, outgoingProxy }) => {
  const tokenCache = new Map(); // installationId -> { token, expiresAt }
  const installationByRepo = new Map(); // repo -> { installationId, checkedAt }

  // Requests authenticated as the app itself (JWT).
  const appClient = () =>
    createGithubClient({ token: createAppJwt(appId, privateKey), apiUrl, outgoingProxy });

  const getInstallationToken = async (installationId) => {
    const cached = tokenCache.get(installationId);

    if (cached && cached.expiresAt - TOKEN_REFRESH_MARGIN > Date.now()) {
      return cached.token;
    }

    const response = await appClient().request(
      'POST',
      `/app/installations/${installationId}/access_tokens`,
    );

    if (response.status !== 201 || !response.body || !response.body.token) {
      throw new GithubError(
        response.status === 401
          ? 'GitHub rejected the app credentials (check GITHUB_APP_ID and the private key)'
          : `Could not get a GitHub App installation token (GitHub status ${response.status})`,
        response.status,
      );
    }

    tokenCache.set(installationId, {
      token: response.body.token,
      expiresAt: Date.parse(response.body.expires_at),
    });

    return response.body.token;
  };

  const installationClient = async (installationId) =>
    createGithubClient({
      token: await getInstallationToken(installationId),
      apiUrl,
      outgoingProxy,
    });

  const getInstallationIdForRepo = async (repo) => {
    const cached = installationByRepo.get(repo.toLowerCase());

    if (cached && Date.now() - cached.checkedAt < INSTALLATION_CACHE_TTL) {
      return cached.installationId;
    }

    const response = await appClient().request('GET', `/repos/${repo}/installation`);

    if (response.status === 404) {
      throw new GithubError(`The GitHub App is not installed on ${repo}`, 404);
    }

    if (response.status !== 200 || !response.body) {
      throw new GithubError(
        response.status === 401
          ? 'GitHub rejected the app credentials (check GITHUB_APP_ID and the private key)'
          : `Could not find the GitHub App installation for ${repo} (GitHub status ${response.status})`,
        response.status,
      );
    }

    installationByRepo.set(repo.toLowerCase(), {
      installationId: response.body.id,
      checkedAt: Date.now(),
    });

    return response.body.id;
  };

  // A REST client authenticated for the installation that covers `repo`.
  const clientForRepo = async (repo) => installationClient(await getInstallationIdForRepo(repo));

  const listInstallationIds = async () => {
    const response = await appClient().request('GET', '/app/installations?per_page=100');

    if (response.status !== 200 || !Array.isArray(response.body)) {
      throw new GithubError(
        response.status === 401
          ? 'GitHub rejected the app credentials (check GITHUB_APP_ID and the private key)'
          : `Could not list GitHub App installations (GitHub status ${response.status})`,
        response.status,
      );
    }

    return response.body.map(({ id }) => id);
  };

  // Every repository the app is installed on, across all installations.
  const listRepositories = async () => {
    const repositories = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const installationId of await listInstallationIds()) {
      // eslint-disable-next-line no-await-in-loop
      const client = await installationClient(installationId);

      for (let page = 1; page <= MAX_REPOSITORY_PAGES; page += 1) {
        // eslint-disable-next-line no-await-in-loop
        const response = await client.request(
          'GET',
          `/installation/repositories?per_page=${REPOSITORIES_PER_PAGE}&page=${page}`,
        );

        if (response.status !== 200 || !response.body || !response.body.repositories) {
          throw new GithubError(
            `Could not list repositories (GitHub status ${response.status})`,
            response.status,
          );
        }

        response.body.repositories.forEach((repository) => {
          repositories.push({
            fullName: repository.full_name,
            defaultBranch: repository.default_branch,
            isPrivate: repository.private,
          });

          installationByRepo.set(repository.full_name.toLowerCase(), {
            installationId,
            checkedAt: Date.now(),
          });
        });

        if (response.body.repositories.length < REPOSITORIES_PER_PAGE) {
          break;
        }
      }
    }

    return repositories;
  };

  return { clientForRepo, listRepositories };
};

// One app instance per process, so tokens are cached across requests. Returns
// null when the app is not configured.
let cachedApp;
let cachedAppKey;

const getGithubApp = () => {
  const { githubAppId, githubAppPrivateKey, githubApiUrl, outgoingProxy } = sails.config.custom;

  if (!githubAppId || !githubAppPrivateKey) {
    return null;
  }

  const key = `${githubAppId}|${githubApiUrl}|${outgoingProxy}`;

  if (!cachedApp || cachedAppKey !== key) {
    cachedApp = createGithubApp({
      appId: githubAppId,
      privateKey: githubAppPrivateKey,
      apiUrl: githubApiUrl,
      outgoingProxy,
    });
    cachedAppKey = key;
  }

  return cachedApp;
};

module.exports = {
  createAppJwt,
  createGithubApp,
  getGithubApp,
};
