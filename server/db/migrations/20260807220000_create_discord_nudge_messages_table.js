// Logs each Discord nudge message sent for a project, so a standalone bot
// service can map a reaction back to the project it belongs to. Read/written
// directly by that bot via SQL — no Waterline model, Planka's own app code
// doesn't touch this table.
exports.up = (knex) =>
  knex.schema.createTable('discord_nudge_messages', (table) => {
    table.bigInteger('id').notNullable().primary().defaultTo(knex.raw('next_id()'));
    table
      .bigInteger('project_id')
      .notNullable()
      .references('id')
      .inTable('project')
      .onDelete('CASCADE');
    table.string('discord_message_id').notNullable();
    table.timestamp('sent_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

exports.down = (knex) => knex.schema.dropTableIfExists('discord_nudge_messages');
