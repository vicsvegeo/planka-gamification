// Projects can have their own ticket key prefix (e.g. SHOP-1) with its own
// counter; projects without one keep using BLAPP. The prefix is chosen when the
// project is created and never changes.
//
// Each card stores its prefix next to its number, so its key stays the same
// even if the card is moved to a project with another prefix (branch names keep
// pointing to it). Keys are unique per (prefix, number).
//
// Counters live in ticket_counter, one row per prefix. The old global sequence
// becomes the BLAPP row. The insert trigger now also fills ticket_prefix from
// the card's project, and bumps the prefix's counter (the upsert locks the row,
// so concurrent inserts can't get the same number).
exports.up = async (knex) => {
  await knex.schema.createTable('ticket_counter', (table) => {
    table.text('prefix').primary();
    table.integer('last_number').notNullable();
  });

  await knex.raw(`
    INSERT INTO ticket_counter (prefix, last_number)
    SELECT 'BLAPP', GREATEST(COALESCE((SELECT MAX(ticket_number) FROM card), 0),
      (SELECT CASE WHEN is_called THEN last_value ELSE last_value - 1 END FROM card_ticket_number_seq))
  `);

  await knex.schema.alterTable('project', (table) => {
    table.text('ticket_prefix');
    table.unique(['ticket_prefix']);
  });

  await knex.schema.alterTable('card', (table) => {
    table.text('ticket_prefix');
  });

  await knex.raw("UPDATE card SET ticket_prefix = 'BLAPP'");

  await knex.raw('DROP TRIGGER card_assign_ticket_number ON card');
  await knex.raw('DROP FUNCTION assign_card_ticket_number()');
  await knex.raw('ALTER TABLE card ALTER COLUMN ticket_number DROP DEFAULT');
  await knex.raw('DROP SEQUENCE card_ticket_number_seq');

  await knex.raw(`
    CREATE FUNCTION assign_card_ticket_number() RETURNS trigger AS $$
    BEGIN
      IF NEW.ticket_prefix IS NULL THEN
        SELECT project.ticket_prefix INTO NEW.ticket_prefix
        FROM board
        JOIN project ON project.id = board.project_id
        WHERE board.id = NEW.board_id;

        NEW.ticket_prefix := COALESCE(NEW.ticket_prefix, 'BLAPP');
      END IF;

      IF NEW.ticket_number IS NULL THEN
        INSERT INTO ticket_counter (prefix, last_number)
        VALUES (NEW.ticket_prefix, 1)
        ON CONFLICT (prefix) DO UPDATE SET last_number = ticket_counter.last_number + 1
        RETURNING last_number INTO NEW.ticket_number;
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

  await knex.schema.alterTable('card', (table) => {
    table.text('ticket_prefix').notNullable().alter();
    table.dropUnique(['ticket_number']);
    table.unique(['ticket_prefix', 'ticket_number']);
  });
};

// Only reversible while every card still uses BLAPP (numbers must be unique).
exports.down = async (knex) => {
  await knex.raw('DROP TRIGGER card_assign_ticket_number ON card');
  await knex.raw('DROP FUNCTION assign_card_ticket_number()');

  await knex.schema.alterTable('card', (table) => {
    table.dropUnique(['ticket_prefix', 'ticket_number']);
    table.unique(['ticket_number']);
    table.dropColumn('ticket_prefix');
  });

  await knex.schema.alterTable('project', (table) => {
    table.dropColumn('ticket_prefix');
  });

  const {
    rows: [{ next }],
  } = await knex.raw(`
    SELECT GREATEST(
      COALESCE((SELECT last_number FROM ticket_counter WHERE prefix = 'BLAPP'), 0),
      COALESCE((SELECT MAX(ticket_number) FROM card), 0)
    ) + 1 AS next
  `);

  await knex.raw(`CREATE SEQUENCE card_ticket_number_seq AS integer START WITH ${Number(next)}`);
  await knex.raw('ALTER SEQUENCE card_ticket_number_seq OWNED BY card.ticket_number');

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

  await knex.schema.dropTable('ticket_counter');
};
