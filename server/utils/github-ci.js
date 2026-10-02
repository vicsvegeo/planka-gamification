/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const CiStates = {
  RUNNING: 'running',
  PASSED: 'passed',
  FAILED: 'failed',
};

const PASSED_CONCLUSIONS = ['success', 'neutral', 'skipped'];

// Cancelled / timed out / needs action count as failed: the badge answers
// "is this safe to merge?".
const getRunState = (workflowRun) => {
  if (workflowRun.status !== 'completed') {
    return CiStates.RUNNING;
  }

  return PASSED_CONCLUSIONS.includes(workflowRun.conclusion) ? CiStates.PASSED : CiStates.FAILED;
};

// One commit can have several workflows (e.g. CI + review): any failure wins,
// then anything still running, otherwise passed.
const summarize = (runs) => {
  const list = Object.values(runs);

  const pick = (state) => list.find((run) => run.state === state);
  const run = pick(CiStates.FAILED) || pick(CiStates.RUNNING) || list[0];

  return {
    githubCiState: run.state,
    githubCiUrl: run.url,
  };
};

// Returns the card fields to update for a workflow_run delivery, or null when it
// must be ignored (a run for an older commit arriving late).
const buildCiValues = (card, workflowRun) => {
  const tracked = card.githubCiRuns;
  const startedAt = workflowRun.run_started_at || workflowRun.created_at;

  const run = {
    name: workflowRun.name,
    state: getRunState(workflowRun),
    url: workflowRun.html_url,
  };

  let runs;
  let headStartedAt;

  if (tracked && tracked.headSha === workflowRun.head_sha) {
    runs = { ...tracked.runs, [workflowRun.workflow_id]: run };
    headStartedAt = tracked.headStartedAt;
  } else {
    if (tracked && tracked.headStartedAt && startedAt && startedAt < tracked.headStartedAt) {
      return null;
    }

    // A new commit (push) resets the state.
    runs = { [workflowRun.workflow_id]: run };
    headStartedAt = startedAt;
  }

  return {
    githubCiRuns: {
      headSha: workflowRun.head_sha,
      headStartedAt,
      runs,
    },
    ...summarize(runs),
  };
};

module.exports = {
  CiStates,
  getRunState,
  buildCiValues,
};
