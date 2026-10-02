const { expect } = require('chai');

const {
  START_MARKER,
  END_MARKER,
  extractSections,
  buildBlock,
  mergeIntoBody,
} = require('../../utils/card-context');

// The style the Planka cards use (bold-line headings, as written by the editor).
const CARD_DESCRIPTION = [
  '**Why**',
  'The reviewer needs context.',
  '',
  '**Done when**',
  '',
  '- Opening a PR adds the sections.',
  '- Re-syncing replaces them.',
  '',
  '**Notes**',
  '',
  '- Not part of the block.',
].join('\n');

const block = (description) =>
  buildBlock({
    ticketKey: 'BLAPP-42',
    cardName: 'Sync context',
    cardUrl: 'https://planka.example/cards/1',
    description,
  });

describe('card-context', () => {
  describe('#extractSections()', () => {
    it('reads bold-line sections and stops at the next heading', () => {
      expect(extractSections(CARD_DESCRIPTION)).to.deep.equal({
        why: 'The reviewer needs context.',
        doneWhen: '- Opening a PR adds the sections.\n- Re-syncing replaces them.',
      });
    });

    it('reads markdown headings, any level and case, with a colon', () => {
      expect(
        extractSections('# Title\n## WHY:\nBecause.\n### Done When\n- [ ] it works\n## Notes\nx'),
      ).to.deep.equal({
        why: 'Because.',
        doneWhen: '- [ ] it works',
      });
    });

    it('handles CRLF and keeps inline bold inside a section', () => {
      expect(extractSections('**Why**\r\nIt is **really** needed.\r\n').why).to.equal(
        'It is **really** needed.',
      );
    });

    it('returns nothing without the headings', () => {
      expect(extractSections('Just some text.')).to.deep.equal({});
      expect(extractSections(null)).to.deep.equal({});
      expect(extractSections('**Why**\n\n**Done when**\n')).to.deep.equal({});
    });
  });

  describe('#buildBlock()', () => {
    it('wraps the sections in markers with the key, title and card link', () => {
      const text = block(CARD_DESCRIPTION);

      expect(text.startsWith(START_MARKER)).to.equal(true);
      expect(text.endsWith(END_MARKER)).to.equal(true);
      expect(text).to.include('### BLAPP-42: Sync context');
      expect(text).to.include('(https://planka.example/cards/1)');
      expect(text).to.include('#### Why\n\nThe reviewer needs context.');
      expect(text).to.include('#### Done when\n\n- Opening a PR adds the sections.');
      expect(text).not.to.include('Not part of the block');
    });

    it('leaves an informative message when both sections are missing', () => {
      const text = block('No structure here');

      expect(text).to.include('has no **Why** or **Done when** section');
      expect(text).not.to.include('#### Why');
    });

    it('notes a single missing section', () => {
      expect(block('**Why**\nBecause.')).to.include('_The card has no Done when section._');
    });
  });

  describe('#mergeIntoBody()', () => {
    const first = block(CARD_DESCRIPTION);

    it('puts the block above an existing body, or uses it alone', () => {
      expect(mergeIntoBody('My notes', first)).to.equal(`${first}\n\nMy notes`);
      expect(mergeIntoBody(null, first)).to.equal(first);
      expect(mergeIntoBody('  ', first)).to.equal(first);
    });

    it('replaces the block in place on re-sync, keeping the rest', () => {
      const body = `Intro\n\n${first}\n\nMy notes`;
      const second = block('**Why**\nChanged $& reason.');
      const merged = mergeIntoBody(body, second);

      expect(merged).to.equal(`Intro\n\n${second}\n\nMy notes`);
      expect(merged.split(START_MARKER)).to.have.length(2);
    });
  });
});
