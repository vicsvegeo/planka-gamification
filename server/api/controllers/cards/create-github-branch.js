/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /cards/{id}/github-branch:
 *   post:
 *     summary: Create GitHub branch for card
 *     description: Creates a `<type>/BLAPP-<n>-<slug>` branch (type = the card's first type label, feat by default) from the tip of the project's base branch in the project's GitHub repository, or reuses it if it already exists, and stores its name on the card. Requires board editor permissions.
 *     tags:
 *       - Cards
 *     operationId: createCardGithubBranch
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the card to create the branch for
 *         schema:
 *           type: string
 *           example: "1357158568008091264"
 *     responses:
 *       200:
 *         description: Branch created or reused
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - item
 *               properties:
 *                 item:
 *                   $ref: '#/components/schemas/Card'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 */

const { idInput } = require('../../../utils/inputs');
const { DEFAULT_BASE_BRANCH, buildBranchName } = require('../../../utils/github-branches');
const { pickBranchType } = require('../../../utils/type-labels');
const { PrStates } = require('../../../utils/github-webhooks');
const { GithubError, createGithubClient } = require('../../../utils/github-api');

const Errors = {
  NOT_ENOUGH_RIGHTS: {
    notEnoughRights: 'Not enough rights',
  },
  CARD_NOT_FOUND: {
    cardNotFound: 'Card not found',
  },
  GITHUB_NOT_CONFIGURED: {
    githubNotConfigured: 'GitHub is not configured on this server (GITHUB_TOKEN is missing)',
  },
  PROJECT_HAS_NO_GITHUB_REPO: {
    projectHasNoGithubRepo: 'This project has no GitHub repository set',
  },
};

module.exports = {
  inputs: {
    id: {
      ...idInput,
      required: true,
    },
  },

  exits: {
    notEnoughRights: {
      responseType: 'forbidden',
    },
    cardNotFound: {
      responseType: 'notFound',
    },
    githubNotConfigured: {
      responseType: 'unprocessableEntity',
    },
    projectHasNoGithubRepo: {
      responseType: 'unprocessableEntity',
    },
    githubRequestFailed: {
      responseType: 'unprocessableEntity',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    const { card, board, project } = await sails.helpers.cards
      .getPathToProjectById(inputs.id)
      .intercept('pathNotFound', () => Errors.CARD_NOT_FOUND);

    const boardMembership = await BoardMembership.qm.getOneByBoardIdAndUserId(
      board.id,
      currentUser.id,
    );

    if (!boardMembership) {
      throw Errors.CARD_NOT_FOUND; // Forbidden
    }

    if (boardMembership.role !== BoardMembership.Roles.EDITOR) {
      throw Errors.NOT_ENOUGH_RIGHTS;
    }

    // Already linked: the client shows "Open on GitHub" instead.
    if (card.githubBranch) {
      return {
        item: card,
      };
    }

    if (!project.githubRepo) {
      throw Errors.PROJECT_HAS_NO_GITHUB_REPO;
    }

    const { githubToken, githubApiUrl, outgoingProxy } = sails.config.custom;

    if (!githubToken) {
      throw Errors.GITHUB_NOT_CONFIGURED;
    }

    const cardLabels = await CardLabel.qm.getByCardId(card.id);
    const labels = await Label.qm.getByIds(sails.helpers.utils.mapRecords(cardLabels, 'labelId'));

    const branch = buildBranchName({
      type: pickBranchType(labels),
      ticketNumber: card.ticketNumber,
      name: card.name,
    });

    const github = createGithubClient({
      token: githubToken,
      apiUrl: githubApiUrl,
      outgoingProxy,
    });

    try {
      await github.ensureBranch({
        repo: project.githubRepo,
        baseBranch: project.githubBaseBranch || DEFAULT_BASE_BRANCH,
        branch,
      });
    } catch (error) {
      if (error instanceof GithubError) {
        throw {
          githubRequestFailed: error.message,
        };
      }

      throw error;
    }

    const { card: updatedCard } = await Card.qm.updateOne(
      {
        id: card.id,
      },
      {
        githubBranch: branch,
        ...(!card.githubPrState && {
          githubPrState: PrStates.BRANCH,
        }),
      },
    );

    if (!updatedCard) {
      throw Errors.CARD_NOT_FOUND;
    }

    sails.sockets.broadcast(
      `board:${updatedCard.boardId}`,
      'cardUpdate',
      {
        item: _.pick(updatedCard, ['id', 'githubBranch', 'githubPrState']),
      },
      this.req,
    );

    return {
      item: updatedCard,
    };
  },
};
