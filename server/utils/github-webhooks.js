/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const crypto = require('crypto');

const { TICKET_KEY_PREFIX } = require('./ticket-keys');
const { buildCiValues } = require('./github-ci');

const PrStates = {
  BRANCH: 'branch',
  OPEN: 'open',
  MERGED: 'merged',
  CLOSED: 'closed',
};

const TICKET_KEY_REGEX = new RegExp(`(?:^|[^A-Za-z0-9])${TICKET_KEY_PREFIX}-(\\d+)(?![0-9])`, 'i');

// GitHub signs the raw body: X-Hub-Signature-256: sha256=<hex HMAC-SHA256>.
const verifySignature = (secret, rawBody, signatureHeader) => {
  if (!secret || !rawBody || typeof signatureHeader !== 'string') {
    return false;
  }

  const expected = Buffer.from(
    `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`,
  );
  const actual = Buffer.from(signatureHeader);

  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
};

const parseTicketNumber = (branchName) => {
  if (typeof branchName !== 'string') {
    return null;
  }

  const match = branchName.match(TICKET_KEY_REGEX);
  return match ? parseInt(match[1], 10) : null;
};

const getPrState = (pullRequest) => {
  if (pullRequest.state === 'open') {
    return PrStates.OPEN;
  }

  return pullRequest.merged ? PrStates.MERGED : PrStates.CLOSED;
};

// Turns a webhook delivery into { branch, repo, buildValues(card) }, or null
// when the event is irrelevant. buildValues returns the card fields to update,
// or null when the event must not change this card.
const parseEvent = (eventName, payload) => {
  if (!payload || !payload.repository) {
    return null;
  }

  const repo = payload.repository.full_name;

  if (eventName === 'create') {
    if (payload.ref_type !== 'branch') {
      return null;
    }

    return {
      branch: payload.ref,
      repo,
      // A late branch event must never downgrade a PR state.
      buildValues: (card) => (card.githubPrState ? null : { githubPrState: PrStates.BRANCH }),
    };
  }

  if (eventName === 'pull_request') {
    const pullRequest = payload.pull_request;

    if (!pullRequest || !pullRequest.head) {
      return null;
    }

    const isNewPr = ['opened', 'reopened'].includes(payload.action);

    return {
      branch: pullRequest.head.ref,
      repo,
      // Opening (or reopening) a PR syncs the card context into its description.
      pullRequestToSync: isNewPr ? pullRequest : null,
      buildValues: (card) => {
        // Only a newly (re)opened PR may take over tracking from another one, so a
        // late event for an old PR can't overwrite the state of the current one.
        if (!isNewPr && card.githubPrNumber && card.githubPrNumber !== pullRequest.number) {
          return null;
        }

        return {
          githubPrState: getPrState(pullRequest),
          githubPrNumber: pullRequest.number,
          githubPrUrl: pullRequest.html_url,
        };
      },
    };
  }

  if (eventName === 'workflow_run') {
    const workflowRun = payload.workflow_run;

    if (!workflowRun || !workflowRun.head_branch) {
      return null;
    }

    return {
      branch: workflowRun.head_branch,
      repo,
      buildValues: (card) => buildCiValues(card, workflowRun),
    };
  }

  return null;
};

module.exports = {
  PrStates,
  verifySignature,
  parseTicketNumber,
  parseEvent,
};
