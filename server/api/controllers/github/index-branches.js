/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /github/branches:
 *   get:
 *     summary: Get GitHub branches
 *     description: Lists the branches of a GitHub repository the GitHub App is installed on, sorted by name, for picking a project's base branch. Requires admin or project manager rights.
 *     tags:
 *       - GitHub
 *     operationId: getGithubBranches
 *     parameters:
 *       - name: repo
 *         in: query
 *         required: true
 *         description: Repository (owner/repo)
 *         schema:
 *           type: string
 *           example: octocat/hello-world
 *     responses:
 *       200:
 *         description: Branches retrieved successfully
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
 *                       name:
 *                         type: string
 *                         example: main
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 */

const { GithubError } = require('../../../utils/github-api');
const { getGithubApp } = require('../../../utils/github-app');
const { isValidRepo } = require('../../../utils/github-branches');

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
  inputs: {
    repo: {
      type: 'string',
      maxLength: 200,
      custom: isValidRepo,
      required: true,
    },
  },

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

  async fn(inputs) {
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

    let branches;
    try {
      branches = await githubApp.listBranches(inputs.repo);
    } catch (error) {
      if (error instanceof GithubError) {
        throw {
          githubRequestFailed: error.message,
        };
      }

      throw error;
    }

    return {
      items: _.sortBy(branches, (name) => name.toLowerCase()).map((name) => ({ name })),
    };
  },
};
