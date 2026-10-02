const crypto = require('crypto');
const { expect } = require('chai');

const { verifySignature, parseTicketNumber, parseEvent } = require('../../utils/github-webhooks');

const sign = (secret, body) =>
  `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;

const pr = (overrides) => ({
  number: 7,
  state: 'open',
  merged: false,
  html_url: 'https://github.com/o/r/pull/7',
  head: { ref: 'feat/BLAPP-42-thing' },
  ...overrides,
});

const prEvent = (action, prOverrides) =>
  parseEvent('pull_request', {
    action,
    repository: { full_name: 'o/r' },
    pull_request: pr(prOverrides),
  });

describe('github-webhooks', () => {
  describe('#verifySignature()', () => {
    const body = Buffer.from('{"zen":"Keep it simple"}');

    it('accepts a valid signature', () => {
      expect(verifySignature('s3cret', body, sign('s3cret', body))).to.equal(true);
    });

    it('rejects a wrong secret, tampered body or missing header', () => {
      expect(verifySignature('s3cret', body, sign('other', body))).to.equal(false);
      expect(verifySignature('s3cret', Buffer.from('{}'), sign('s3cret', body))).to.equal(false);
      expect(verifySignature('s3cret', body, undefined)).to.equal(false);
      expect(verifySignature('s3cret', body, 'sha256=short')).to.equal(false);
    });

    it('rejects everything when no secret is configured', () => {
      expect(verifySignature(undefined, body, sign('', body))).to.equal(false);
    });
  });

  describe('#parseTicketNumber()', () => {
    it('finds the key in generated and hand-made branch names', () => {
      expect(parseTicketNumber('feat/BLAPP-42-crash-on-empty-list')).to.equal(42);
      expect(parseTicketNumber('BLAPP-7')).to.equal(7);
      expect(parseTicketNumber('victor/blapp-12_quick-fix')).to.equal(12);
    });

    it('ignores branches without a key or with a longer prefix', () => {
      expect(parseTicketNumber('main')).to.equal(null);
      expect(parseTicketNumber('feat/XBLAPP-42')).to.equal(null);
      expect(parseTicketNumber('feat/BLAPP-')).to.equal(null);
      expect(parseTicketNumber(undefined)).to.equal(null);
    });
  });

  describe('#parseEvent()', () => {
    it('a branch create on a card without a branch starts fresh', () => {
      const event = parseEvent('create', {
        ref: 'feat/BLAPP-42-x',
        ref_type: 'branch',
        repository: { full_name: 'o/r' },
      });

      expect(event.linkBranch).to.equal(true);
      expect(
        event.buildValues({ githubBranch: null, githubPrState: 'merged', githubPrNumber: 3 }),
      ).to.deep.equal({
        githubPrState: 'branch',
        githubPrNumber: null,
        githubPrUrl: null,
        githubCiState: null,
        githubCiUrl: null,
        githubCiRuns: null,
      });
    });

    it('a branch delete unlinks the branch and its CI, keeping a PR badge', () => {
      const event = parseEvent('delete', {
        ref: 'feat/BLAPP-42-x',
        ref_type: 'branch',
        repository: { full_name: 'o/r' },
      });

      expect(event.linkBranch).to.equal(false);
      expect(
        event.buildValues({ githubBranch: 'feat/BLAPP-42-x', githubPrState: 'branch' }),
      ).to.deep.equal({
        githubBranch: null,
        githubCiState: null,
        githubCiUrl: null,
        githubCiRuns: null,
        githubPrState: null,
      });
      expect(
        event.buildValues({ githubBranch: 'feat/BLAPP-42-x', githubPrState: 'merged' }),
      ).to.deep.equal({
        githubBranch: null,
        githubCiState: null,
        githubCiUrl: null,
        githubCiRuns: null,
      });
    });

    it('ignores deleting another branch or a tag', () => {
      const event = parseEvent('delete', {
        ref: 'feat/BLAPP-42-old-name',
        ref_type: 'branch',
        repository: { full_name: 'o/r' },
      });

      expect(event.buildValues({ githubBranch: 'feat/BLAPP-42-x' })).to.equal(null);
      expect(
        parseEvent('delete', { ref: 'v1', ref_type: 'tag', repository: { full_name: 'o/r' } }),
      ).to.equal(null);
    });

    it('only new PRs and branch creation may link a branch to a card', () => {
      expect(prEvent('opened').linkBranch).to.equal(true);
      expect(prEvent('reopened').linkBranch).to.equal(true);
      expect(prEvent('closed', { state: 'closed' }).linkBranch).to.equal(false);
      expect(prEvent('edited').linkBranch).to.equal(false);
    });

    it('maps a branch create to "branch" only when there is no PR state yet', () => {
      const event = parseEvent('create', {
        ref: 'feat/BLAPP-42-x',
        ref_type: 'branch',
        repository: { full_name: 'o/r' },
      });

      expect(event.branch).to.equal('feat/BLAPP-42-x');
      expect(event.repo).to.equal('o/r');
      expect(
        event.buildValues({ githubBranch: 'feat/BLAPP-42-x', githubPrState: null }),
      ).to.deep.equal({
        githubPrState: 'branch',
      });
      expect(
        event.buildValues({ githubBranch: 'feat/BLAPP-42-x', githubPrState: 'open' }),
      ).to.equal(null);
    });

    it('ignores tag creation and unrelated events', () => {
      expect(
        parseEvent('create', { ref: 'v1', ref_type: 'tag', repository: { full_name: 'o/r' } }),
      ).to.equal(null);
      expect(parseEvent('push', { repository: { full_name: 'o/r' } })).to.equal(null);
      expect(parseEvent('pull_request', {})).to.equal(null);
    });

    it('maps opened / reopened / closed+merged / closed', () => {
      expect(prEvent('opened').buildValues({}).githubPrState).to.equal('open');
      expect(prEvent('reopened').buildValues({}).githubPrState).to.equal('open');
      expect(
        prEvent('closed', { state: 'closed', merged: true }).buildValues({}).githubPrState,
      ).to.equal('merged');
      expect(prEvent('closed', { state: 'closed' }).buildValues({}).githubPrState).to.equal(
        'closed',
      );
    });

    it('stores the PR number and link and reports the head branch', () => {
      const event = prEvent('opened');

      expect(event.branch).to.equal('feat/BLAPP-42-thing');
      expect(event.buildValues({})).to.deep.equal({
        githubPrState: 'open',
        githubPrNumber: 7,
        githubPrUrl: 'https://github.com/o/r/pull/7',
      });
    });

    it('maps workflow runs to the CI state of the head branch', () => {
      const event = parseEvent('workflow_run', {
        action: 'completed',
        repository: { full_name: 'o/r' },
        workflow_run: {
          workflow_id: 1,
          name: 'CI',
          head_branch: 'fix/BLAPP-3-x',
          head_sha: 'abc',
          status: 'completed',
          conclusion: 'success',
          html_url: 'https://github.com/o/r/actions/runs/1',
          run_started_at: '2026-10-02T10:00:00Z',
        },
      });

      expect(event.branch).to.equal('fix/BLAPP-3-x');
      const values = event.buildValues({});
      expect(values.githubCiState).to.equal('passed');
      expect(values.githubCiUrl).to.equal('https://github.com/o/r/actions/runs/1');
    });

    it('does not let an old PR overwrite the tracked one', () => {
      const tracked = { githubPrState: 'open', githubPrNumber: 9 };

      expect(prEvent('closed', { state: 'closed' }).buildValues(tracked)).to.equal(null);
      expect(prEvent('edited').buildValues(tracked)).to.equal(null);
      // A newly opened PR takes over.
      expect(prEvent('opened').buildValues(tracked).githubPrNumber).to.equal(7);
    });
  });
});
