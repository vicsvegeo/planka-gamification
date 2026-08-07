// Log of project inactivity nudges actually sent. One row per project per
// nudge cycle (not per recipient) — the scanner's dedup check is "has a
// nudge already been logged for this project in the last 7 days", per
// project, regardless of how many recipients it went to.
//
// Unlike discord_nudge_messages (bot-only, no Waterline layer), this table
// is read/written directly by Planka's own scanner, so it gets created_at/
// updated_at up front — every other Waterline model inherits those from the
// global model config (config/models.js), and card_reminders needed a
// follow-up migration to add them after the fact for exactly this reason.
exports.up = (knex) =>
  knex.schema.createTable('project_nudges', (table) => {
    table.bigInteger('id').notNullable().primary().defaultTo(knex.raw('next_id()'));
    table
      .bigInteger('project_id')
      .notNullable()
      .references('id')
      .inTable('project')
      .onDelete('CASCADE');
    table.timestamp('sent_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable();
    table.timestamp('updated_at', { useTz: true });

    table.index(['project_id', 'sent_at']);
  });

exports.down = (knex) => knex.schema.dropTableIfExists('project_nudges');
