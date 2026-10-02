// Human-readable ticket keys (BLAPP-<n>). One global sequence across the whole
// instance, so a number is unique everywhere and is never reused, even after a
// card is deleted. Existing cards are backfilled in creation (id) order.
//
// A BEFORE INSERT trigger assigns the number instead of a column default:
// Waterline sends an explicit NULL for attributes it isn't given, which would
// bypass a plain DEFAULT. The trigger covers every insert path (create,
// duplicate, Trello import, raw SQL).
exports.up = async (knex) => {
  await knex.raw('CREATE SEQUENCE card_ticket_number_seq AS integer START WITH 1');

  await knex.schema.alterTable('card', (table) => {
    table.integer('ticket_number');
  });

  await knex.raw(`
    UPDATE card
    SET ticket_number = numbered.ticket_number
    FROM (
      SELECT id, nextval('card_ticket_number_seq') AS ticket_number
      FROM (SELECT id FROM card ORDER BY id) AS ordered
    ) AS numbered
    WHERE card.id = numbered.id
  `);

  await knex.raw(`
    CREATE FUNCTION assign_card_ticket_number() RETURNS trigger AS $$
    BEGIN
      IF NEW.ticket_number IS NULL THEN
        NEW.ticket_number := nextval('card_ticket_number_seq');
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER card_assign_ticket_number
    BEFORE INSERT ON card
    FOR EACH ROW EXECUTE FUNCTION assign_card_ticket_number()
  `);

  await knex.raw('ALTER SEQUENCE card_ticket_number_seq OWNED BY card.ticket_number');

  await knex.schema.alterTable('card', (table) => {
    table.integer('ticket_number').notNullable().alter();
    table.unique(['ticket_number']);
  });
};

exports.down = async (knex) => {
  await knex.raw('DROP TRIGGER card_assign_ticket_number ON card');
  await knex.raw('DROP FUNCTION assign_card_ticket_number()');

  await knex.schema.alterTable('card', (table) => {
    table.dropColumn('ticket_number'); // Drops the owned sequence too.
  });
};
