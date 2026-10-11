const { expect } = require('chai');

// Captures the SQL getByEndlessListId builds; the real query is checked against
// Postgres separately since the test datastore is sails-disk.
const captureSearchQuery = async (search) => {
  const { sendNativeQuery } = sails;
  let captured;

  sails.sendNativeQuery = async (query, values) => {
    captured = { query, values };
    return { rows: [] };
  };

  try {
    await Card.qm.getByEndlessListId('1', { search });
  } finally {
    sails.sendNativeQuery = sendNativeQuery;
  }

  return captured;
};

describe('card search', () => {
  it('matches each search part against the ticket key as well', async () => {
    const { query, values } = await captureSearchQuery('BLAPP-42 login');

    expect(values).to.deep.equal(['1', 'BLAPP-', 'blapp-42', 'login']);
    expect(query).to.include(
      "card.name ILIKE '%' || $3 || '%' OR card.description ILIKE '%' || $3 || '%' OR ($2::text || card.ticket_number::text) ILIKE '%' || $3 || '%'",
    );
    expect(query).to.include("($2::text || card.ticket_number::text) ILIKE '%' || $4 || '%'");
  });

  it('matches a regex search against the ticket key', async () => {
    const { query, values } = await captureSearchQuery('/^BLAPP-42$');

    expect(values).to.deep.equal(['1', 'BLAPP-', '^BLAPP-42$']);
    expect(query).to.include('($2::text || card.ticket_number::text) ~* $3');
  });
});
