const { expect } = require('chai');

const {
  slugify,
  buildBranchName,
  isValidRepo,
  isValidBranchName,
} = require('../../utils/github-branches');

describe('github-branches', () => {
  describe('#slugify()', () => {
    it('lowercases and hyphenates', () => {
      expect(slugify('Crash on Empty List!')).to.equal('crash-on-empty-list');
    });

    it('strips accents and collapses symbols', () => {
      expect(slugify('  Café — "Create branch"  button ')).to.equal('cafe-create-branch-button');
    });

    it('cuts long titles at a word boundary within the limit', () => {
      const slug = slugify('Sync card Why/Done-when into the PR description automatically');

      expect(slug).to.equal('sync-card-why-done-when-into-the-pr');
      expect(slug.length).to.be.at.most(40);
    });

    it('hard-cuts a single very long word', () => {
      expect(slugify('a'.repeat(60))).to.equal('a'.repeat(40));
    });

    it('returns an empty string when nothing is usable', () => {
      expect(slugify('!!! ???')).to.equal('');
    });
  });

  describe('#buildBranchName()', () => {
    it('builds <type>/BLAPP-<n>-<slug>', () => {
      expect(buildBranchName({ ticketNumber: 42, name: 'Crash on empty list' })).to.equal(
        'feat/BLAPP-42-crash-on-empty-list',
      );
    });

    it('uses the given type as the prefix', () => {
      expect(buildBranchName({ type: 'fix', ticketNumber: 7, name: 'Typo' })).to.equal(
        'fix/BLAPP-7-typo',
      );
    });

    it('drops the slug when the title has no usable characters', () => {
      expect(buildBranchName({ ticketNumber: 3, name: '🚀' })).to.equal('feat/BLAPP-3');
    });
  });

  describe('validation', () => {
    it('accepts owner/repo', () => {
      expect(isValidRepo('vicsvegeo/tv-diary')).to.equal(true);
      expect(isValidRepo('some.org/my_repo.js')).to.equal(true);
    });

    it('rejects anything that is not owner/repo', () => {
      ['tv-diary', 'a/b/c', 'https://github.com/a/b', 'a /b', ''].forEach((value) => {
        expect(isValidRepo(value), value).to.equal(false);
      });
    });

    it('accepts normal branch names and rejects invalid refs', () => {
      expect(isValidBranchName('main')).to.equal(true);
      expect(isValidBranchName('release/2.0')).to.equal(true);

      ['', 'a..b', '/main', 'main/', 'feature.lock', 'has space', 'a//b'].forEach((value) => {
        expect(isValidBranchName(value), value).to.equal(false);
      });
    });
  });
});
