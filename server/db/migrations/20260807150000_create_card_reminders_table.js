// Log of due-date reminder notifications sent per card. One row per reminder
// send (not per card), since a card can receive multiple reminders in a day
// (e.g. hourly on its due date) — a scheduled job will read/write this table
// to decide whether a reminder is still owed.
exports.up = (knex) =>
  knex.schema.createTable('card_reminders', (table) => {
    table.bigInteger('id').notNullable().primary().defaultTo(knex.raw('next_id()'));
    table.bigInteger('card_id').notNullable().references('id').inTable('card').onDelete('CASCADE');
    table.timestamp('sent_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['card_id', 'sent_at']);
  });

exports.down = (knex) => knex.schema.dropTableIfExists('card_reminders');
