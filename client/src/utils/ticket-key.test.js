import { formatTicketKey } from './ticket-key';

describe('formatTicketKey', () => {
  test('formats a number as a ticket key', () => {
    expect(formatTicketKey(42)).toBe('BLAPP-42');
  });

  test('returns null when the card has no number yet', () => {
    expect(formatTicketKey(null)).toBeNull();
    expect(formatTicketKey(undefined)).toBeNull();
  });
});
