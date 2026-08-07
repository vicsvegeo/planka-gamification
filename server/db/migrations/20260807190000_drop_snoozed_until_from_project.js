// Snoozing needs to be per-user (multiple people share a project), not a
// single value on the project itself. Replaced by the project_snooze table
// (see the following migration). Safe to drop cleanly — nothing reads or
// writes this column yet.
exports.up = (knex) =>
  knex.schema.alterTable('project', (table) => {
    table.dropColumn('snoozed_until');
  });

exports.down = (knex) =>
  knex.schema.alterTable('project', (table) => {
    table.timestamp('snoozed_until', { useTz: true });
  });
