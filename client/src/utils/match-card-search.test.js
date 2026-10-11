import matchCardSearch from './match-card-search';

const card = {
  name: 'Fix login page',
  description: 'The submit button is broken',
  ticketNumber: 42,
};

describe('matchCardSearch', () => {
  test('matches by full ticket key, ignoring case', () => {
    expect(matchCardSearch('BLAPP-42')(card)).toBe(true);
    expect(matchCardSearch('blapp-42')(card)).toBe(true);
  });

  test('matches by bare ticket number', () => {
    expect(matchCardSearch('42')(card)).toBe(true);
  });

  test('does not match a different ticket key', () => {
    expect(matchCardSearch('BLAPP-43')(card)).toBe(false);
    expect(matchCardSearch('BLAPP-420')(card)).toBe(false);
  });

  test('still matches name and description', () => {
    expect(matchCardSearch('login')(card)).toBe(true);
    expect(matchCardSearch('submit')(card)).toBe(true);
    expect(matchCardSearch('missing')(card)).toBe(false);
  });

  test('combines a ticket key with other words', () => {
    expect(matchCardSearch('BLAPP-42 login')(card)).toBe(true);
    expect(matchCardSearch('BLAPP-42 signup')(card)).toBe(false);
  });

  test('matches the ticket key with a regex search', () => {
    expect(matchCardSearch('/^BLAPP-42$')(card)).toBe(true);
    expect(matchCardSearch('/^BLAPP-4$')(card)).toBe(false);
  });

  test('treats an invalid regex as no match', () => {
    expect(matchCardSearch('/(')(card)).toBe(false);
  });

  test('handles cards without a ticket number or description', () => {
    const bareCard = { name: 'Draft', description: null, ticketNumber: null };

    expect(matchCardSearch('draft')(bareCard)).toBe(true);
    expect(matchCardSearch('BLAPP')(bareCard)).toBe(false);
    expect(matchCardSearch('/BLAPP')(bareCard)).toBe(false);
  });
});
