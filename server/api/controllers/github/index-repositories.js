/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /github/repositories:
 *   get:
 *     summary: Get GitHub repositories
 *     description: Lists the GitHub repositories the GitHub App is installed on (across all its installations), sorted by name, for linking a project. Requires admin or project manager rights.
 *     tags:
 *       - GitHub
 *     operationId: getGithubRepositories
 *     responses:
 *       200:
 *         description: Repositories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - items
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       fullName:
 *                         type: string
 *                         example: octocat/hello-world
 *                       defaultBranch:
 *                         type: string
 *                         example: main
 *                       isPrivate:
 *                         type: boolean
 *                         example: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 */

const { GithubError } = require('../../../utils/github-api');
const { getGithubApp } = require('../../../utils/github-app');

const Errors = {
  NOT_ENOUGH_RIGHTS: {
    notEnoughRights: 'Not enough rights',
  },
  GITHUB_NOT_CONFIGURED: {
    githubNotConfigured:
      'GitHub is not configured on this server (GITHUB_APP_ID / GITHUB_APP_PRIVATE_KEY missing)',
  },
};

module.exports = {
  exits: {
    notEnoughRights: {
      responseType: 'forbidden',
    },
    githubNotConfigured: {
      responseType: 'unprocessableEntity',
    },
    githubRequestFailed: {
      responseType: 'unprocessableEntity',
    },
  },

  async fn() {
    const { currentUser } = this.req;

    if (currentUser.role !== User.Roles.ADMIN) {
      const projectManagers = await ProjectManager.qm.getByUserId(currentUser.id);

      if (projectManagers.length === 0) {
        throw Errors.NOT_ENOUGH_RIGHTS;
      }
    }

    const githubApp = getGithubApp();

    if (!githubApp) {
      throw Errors.GITHUB_NOT_CONFIGURED;
    }

    let repositories;
    try {
      repositories = await githubApp.listRepositories();
    } catch (error) {
      if (error instanceof GithubError) {
        throw {
          githubRequestFailed: error.message,
        };
      }

      throw error;
    }

    return {
      items: _.sortBy(repositories, (repository) => repository.fullName.toLowerCase()),
    };
  },
};
