const { expect } = require('chai');

const { pickBranchType } = require('../../utils/type-labels');

const label = (id, position, name) => ({ id: String(id), position, name });

describe('type-labels', () => {
  describe('#pickBranchType()', () => {
    it('defaults to feat without labels', () => {
      expect(pickBranchType([])).to.equal('feat');
    });

    it('ignores labels that are not type labels', () => {
      expect(pickBranchType([label(1, 1, 'P0: Critical'), label(2, 2, null)])).to.equal('feat');
    });

    it('uses the type label', () => {
      expect(pickBranchType([label(1, 1, 'Bug'), label(2, 2, 'fix')])).to.equal('fix');
    });

    it('uses the first type label in label order, not attach order', () => {
      expect(
        pickBranchType([label(5, 300, 'spike'), label(3, 100, 'refactor'), label(4, 200, 'fix')]),
      ).to.equal('refactor');
    });

    it('breaks position ties by id', () => {
      expect(
        pickBranchType([
          label('1877000000000000002', 1, 'chore'),
          label('1877000000000000001', 1, 'fix'),
        ]),
      ).to.equal('fix');
    });

    it('matches case-insensitively and trims', () => {
      expect(pickBranchType([label(1, 1, ' Chore ')])).to.equal('chore');
    });
  });
});
