/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /github/webhook:
 *   post:
 *     summary: Receive GitHub webhook
 *     description: Receives `create`, `pull_request` and `workflow_run` deliveries from a GitHub repository webhook, finds the card from the `BLAPP-<n>` key in the branch name, updates its PR state / CI badges and, when a PR is opened or reopened, syncs the card's Why / Done when into the PR description. Authenticated by the `X-Hub-Signature-256` HMAC signature (GITHUB_WEBHOOK_SECRET), not by a token. Cards are never moved between lists.
 *     tags:
 *       - GitHub
 *     operationId: receiveGithubWebhook
 *     security: []
 *     responses:
 *       200:
 *         description: Delivery processed (the result says whether a card was updated or why it was ignored)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

const {
  verifySignature,
  parseTicketNumber,
  parseEvent,
} = require('../../../utils/github-webhooks');
const { GithubError, createGithubClient } = require('../../../utils/github-api');
const { buildBlock, mergeIntoBody } = require('../../../utils/card-context');
const { formatTicketKey } = require('../../../utils/ticket-keys');

const Errors = {
  NOT_CONFIGURED: {
    notConfigured: 'GitHub webhook is not configured',
  },
  INVALID_SIGNATURE: {
    invalidSignature: 'Invalid signature',
  },
};

// Puts the card's Why / Done when into the PR description (between markers,
// so a re-sync replaces it). Never fails the delivery: problems are reported in
// the result instead.
const syncPullRequestDescription = async (card, repo, pullRequest) => {
  const { githubToken, githubApiUrl, outgoingProxy, baseUrl } = sails.config.custom;

  if (!githubToken) {
    return 'description not synced: GITHUB_TOKEN is missing';
  }

  const block = buildBlock({
    ticketKey: formatTicketKey(card.ticketNumber),
    cardName: card.name,
    cardUrl: `${baseUrl.replace(/\/+$/, '')}/cards/${card.id}`,
    description: card.description,
  });

  const body = mergeIntoBody(pullRequest.body, block);

  if (body === pullRequest.body) {
    return 'description already up to date';
  }

  const github = createGithubClient({
    token: githubToken,
    apiUrl: githubApiUrl,
    outgoingProxy,
  });

  try {
    await github.updatePullRequestBody({
      repo,
      number: pullRequest.number,
      body,
    });
  } catch (error) {
    if (error instanceof GithubError) {
      return `description not synced: ${error.message}`;
    }

    throw error;
  }

  return `synced card context into PR #${pullRequest.number}`;
};

// GitHub can deliver either JSON or form-encoded payloads.
const getPayload = (body) => {
  if (body && typeof body.payload === 'string') {
    return JSON.parse(body.payload);
  }

  return body;
};

module.exports = {
  exits: {
    notConfigured: {
      responseType: 'notFound',
    },
    invalidSignature: {
      responseType: 'unauthorized',
    },
  },

  async fn() {
    const { req } = this;
    const { githubWebhookSecret } = sails.config.custom;

    if (!githubWebhookSecret) {
      throw Errors.NOT_CONFIGURED;
    }

    if (!verifySignature(githubWebhookSecret, req.rawBody, req.headers['x-hub-signature-256'])) {
      throw Errors.INVALID_SIGNATURE;
    }

    const eventName = req.headers['x-github-event'];

    if (eventName === 'ping') {
      return {
        result: 'pong',
      };
    }

    let payload;
    try {
      payload = getPayload(req.body);
    } catch (error) {
      return {
        result: 'ignored: payload is not valid JSON',
      };
    }

    const event = parseEvent(eventName, payload);

    if (!event) {
      return {
        result: `ignored: ${eventName} event is not handled`,
      };
    }

    const ticketNumber = parseTicketNumber(event.branch);

    if (!ticketNumber) {
      return {
        result: `ignored: no ticket key in branch ${event.branch}`,
      };
    }

    const card = await Card.qm.getOneByTicketNumber(ticketNumber);

    if (!card) {
      return {
        result: `ignored: no card for ticket ${ticketNumber}`,
      };
    }

    const board = await Board.qm.getOneById(card.boardId);

    if (
      board &&
      board.githubRepo &&
      board.githubRepo.toLowerCase() !== (event.repo || '').toLowerCase()
    ) {
      return {
        result: `ignored: card board is linked to ${board.githubRepo}, not ${event.repo}`,
      };
    }

    const results = [];
    const values = event.buildValues(card);

    if (values) {
      // Hand-made branches get linked to the card too.
      if (!card.githubBranch) {
        values.githubBranch = event.branch;
      }

      const { card: updatedCard } = await Card.qm.updateOne(
        {
          id: card.id,
        },
        values,
      );

      if (!updatedCard) {
        return {
          result: 'ignored: card was deleted',
        };
      }

      sails.sockets.broadcast(`board:${updatedCard.boardId}`, 'cardUpdate', {
        item: {
          id: updatedCard.id,
          ...values,
        },
      });

      results.push(`updated card ${updatedCard.id}`);
    }

    if (event.pullRequestToSync) {
      results.push(await syncPullRequestDescription(card, event.repo, event.pullRequestToSync));
    }

    return {
      result: results.length > 0 ? results.join('; ') : 'ignored: event does not change the card',
    };
  },
};
