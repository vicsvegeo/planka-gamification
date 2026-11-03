import { formatTicketKey, isTicketPrefix, sanitizeTicketPrefix } from './ticket-key';

describe('formatTicketKey', () => {
  test('formats a prefix and number as a ticket key', () => {
    expect(formatTicketKey('SHOP', 3)).toBe('SHOP-3');
  });

  test('falls back to BLAPP when the card has no prefix', () => {
    expect(formatTicketKey(undefined, 42)).toBe('BLAPP-42');
    expect(formatTicketKey(null, 42)).toBe('BLAPP-42');
  });

  test('returns null when the card has no number yet', () => {
    expect(formatTicketKey('BLAPP', null)).toBeNull();
    expect(formatTicketKey('BLAPP', undefined)).toBeNull();
  });
});

describe('isTicketPrefix', () => {
  test('accepts 2-10 uppercase letters', () => {
    expect(isTicketPrefix('SHOP')).toBe(true);
    expect(isTicketPrefix('AB')).toBe(true);
    expect(isTicketPrefix('ABCDEFGHIJ')).toBe(true);
  });

  test('rejects digits and anything else', () => {
    expect(isTicketPrefix('A')).toBe(false);
    expect(isTicketPrefix('A1')).toBe(false);
    expect(isTicketPrefix('SHOP2')).toBe(false);
    expect(isTicketPrefix('shop')).toBe(false);
    expect(isTicketPrefix('SH-OP')).toBe(false);
    expect(isTicketPrefix('ABCDEFGHIJK')).toBe(false);
  });
});

describe('sanitizeTicketPrefix', () => {
  test('uppercases and drops everything but letters', () => {
    expect(sanitizeTicketPrefix('sh-op 1')).toBe('SHOP');
    expect(sanitizeTicketPrefix('12ab3c')).toBe('ABC');
    expect(sanitizeTicketPrefix('abcdefghijkl')).toBe('ABCDEFGHIJ');
  });
});
