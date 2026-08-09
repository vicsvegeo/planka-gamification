// Per-user card snoozing: one row per (card, user) means "due-date reminders
// for this card are silenced for this user until snoozed_until". Absence of a
// row means "not snoozed" — rows are upserted on renewal, never accumulated.
// Mirrors project_snooze exactly, scoped to a card instead of a project —
// a fully separate mechanism from project_snooze (card-level snoozing never
// touches project nudges, and vice versa). created_at/updated_at are included
// from the start this time (see 20260807250000_add_timestamps_to_project_snooze
// for the bug this avoids repeating).
exports.up = (knex) =>
  knex.schema.createTable('card_snooze', (table) => {
    table.bigInteger('id').notNullable().primary().defaultTo(knex.raw('next_id()'));
    table.bigInteger('card_id').notNullable().references('id').inTable('card').onDelete('CASCADE');
    table
      .bigInteger('user_id')
      .notNullable()
      .references('id')
      .inTable('user_account')
      .onDelete('CASCADE');
    table.timestamp('snoozed_until', { useTz: true }).notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable();
    table.timestamp('updated_at', { useTz: true });

    table.unique(['card_id', 'user_id']);
  });

exports.down = (knex) => knex.schema.dropTableIfExists('card_snooze');
