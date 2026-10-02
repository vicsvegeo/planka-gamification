import buildGithubBranchUrl from './build-github-branch-url';

describe('buildGithubBranchUrl', () => {
  test('keeps slashes and encodes the rest', () => {
    expect(buildGithubBranchUrl('o/r', 'feat/BLAPP-1-a#b')).toBe(
      'https://github.com/o/r/tree/feat/BLAPP-1-a%23b',
    );
  });
});
