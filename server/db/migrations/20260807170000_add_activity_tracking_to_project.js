// Drives the due-date/inactivity nudge scanner (later piece). last_activity_at
// is bumped whenever a non-completed card is updated or moved within the
// project; null means no qualifying activity has been recorded yet — existing
// projects are intentionally left unbackfilled. snoozed_until lets a user
// silence nudges for a project until a given time; unset by default.
exports.up = (knex) =>
  knex.schema.alterTable('project', (table) => {
    table.timestamp('last_activity_at', { useTz: true });
    table.timestamp('snoozed_until', { useTz: true });
  });

exports.down = (knex) =>
  knex.schema.alterTable('project', (table) => {
    table.dropColumn('last_activity_at');
    table.dropColumn('snoozed_until');
  });
