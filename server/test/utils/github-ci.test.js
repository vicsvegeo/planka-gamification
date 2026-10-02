const { expect } = require('chai');

const { getRunState, buildCiValues } = require('../../utils/github-ci');

const run = (overrides) => ({
  id: 100,
  workflow_id: 1,
  name: 'CI',
  head_sha: 'aaa',
  status: 'in_progress',
  conclusion: null,
  html_url: 'https://github.com/o/r/actions/runs/100',
  run_started_at: '2026-10-02T10:00:00Z',
  ...overrides,
});

// Applies a sequence of runs to an empty card, like successive deliveries.
const apply = (...runs) =>
  runs.reduce((card, workflowRun) => {
    const values = buildCiValues(card, workflowRun);
    return values ? { ...card, ...values } : card;
  }, {});

describe('github-ci', () => {
  describe('#getRunState()', () => {
    it('maps statuses and conclusions', () => {
      expect(getRunState(run({ status: 'queued' }))).to.equal('running');
      expect(getRunState(run({ status: 'in_progress' }))).to.equal('running');
      expect(getRunState(run({ status: 'completed', conclusion: 'success' }))).to.equal('passed');
      expect(getRunState(run({ status: 'completed', conclusion: 'skipped' }))).to.equal('passed');
      expect(getRunState(run({ status: 'completed', conclusion: 'failure' }))).to.equal('failed');
      expect(getRunState(run({ status: 'completed', conclusion: 'cancelled' }))).to.equal('failed');
      expect(getRunState(run({ status: 'completed', conclusion: 'timed_out' }))).to.equal('failed');
    });
  });

  describe('#buildCiValues()', () => {
    it('goes running -> passed and links to the run', () => {
      expect(apply(run({ status: 'queued' })).githubCiState).to.equal('running');

      const card = apply(
        run({ status: 'queued' }),
        run({ status: 'completed', conclusion: 'success' }),
      );

      expect(card.githubCiState).to.equal('passed');
      expect(card.githubCiUrl).to.equal('https://github.com/o/r/actions/runs/100');
    });

    it('combines workflows of the same commit: failure wins, then running', () => {
      const ci = run({ status: 'completed', conclusion: 'success' });
      const review = run({ id: 200, workflow_id: 2, name: 'Review', html_url: 'u/200' });

      let card = apply(ci, review);
      expect(card.githubCiState).to.equal('running');
      expect(card.githubCiUrl).to.equal('u/200');

      card = apply(ci, { ...review, status: 'completed', conclusion: 'failure' });
      expect(card.githubCiState).to.equal('failed');
      expect(card.githubCiUrl).to.equal('u/200');

      card = apply(ci, { ...review, status: 'completed', conclusion: 'success' });
      expect(card.githubCiState).to.equal('passed');
    });

    it('resets to running on a new push, dropping the old commit runs', () => {
      const card = apply(
        run({ status: 'completed', conclusion: 'failure' }),
        run({ id: 101, head_sha: 'bbb', status: 'queued', run_started_at: '2026-10-02T11:00:00Z' }),
      );

      expect(card.githubCiState).to.equal('running');
      expect(card.githubCiRuns.headSha).to.equal('bbb');
      expect(Object.keys(card.githubCiRuns.runs)).to.deep.equal(['1']);
    });

    it('ignores a late run of an older commit', () => {
      const newer = run({
        id: 101,
        head_sha: 'bbb',
        status: 'completed',
        conclusion: 'success',
        run_started_at: '2026-10-02T11:00:00Z',
      });
      const card = apply(newer);

      expect(buildCiValues(card, run({ status: 'completed', conclusion: 'failure' }))).to.equal(
        null,
      );
    });

    it('a re-run of the same workflow replaces its previous result', () => {
      const card = apply(
        run({ status: 'completed', conclusion: 'failure' }),
        run({ status: 'in_progress', run_attempt: 2 }),
      );

      expect(card.githubCiState).to.equal('running');
    });
  });
});
