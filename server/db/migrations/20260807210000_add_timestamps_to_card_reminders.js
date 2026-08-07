// Every Waterline model in this codebase inherits createdAt/updatedAt from
// the global model config (config/models.js) and every table has matching
// columns — card_reminders was missed when the table was first created (see
// the same fix for badge_unlock). Table is still empty, so NOT NULL is safe.
exports.up = (knex) =>
  knex.schema.alterTable('card_reminders', (table) => {
    table.timestamp('created_at', { useTz: true }).notNullable();
    table.timestamp('updated_at', { useTz: true });
  });

exports.down = (knex) =>
  knex.schema.alterTable('card_reminders', (table) => {
    table.dropColumn('created_at');
    table.dropColumn('updated_at');
  });
