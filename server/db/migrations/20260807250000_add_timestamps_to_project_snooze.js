// Same fix as card_reminders/badge_unlock: every Waterline model inherits
// createdAt/updatedAt from the global model config (config/models.js) and
// every table has matching columns — project_snooze was missed when first
// created, and this went unnoticed until the project-nudges scanner became
// its first real Waterline caller (ProjectSnooze.qm.isSnoozed). Unlike those
// earlier fixes, this table isn't guaranteed empty (it's been usable via
// direct SQL since it was created), so created_at defaults to now() to
// backfill any existing rows rather than requiring the table to be empty.
exports.up = (knex) =>
  knex.schema.alterTable('project_snooze', (table) => {
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true });
  });

exports.down = (knex) =>
  knex.schema.alterTable('project_snooze', (table) => {
    table.dropColumn('created_at');
    table.dropColumn('updated_at');
  });
