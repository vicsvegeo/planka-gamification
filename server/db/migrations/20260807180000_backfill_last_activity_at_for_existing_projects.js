// Existing projects predate the activity-tracking feature and would otherwise
// look infinitely stale to the inactivity nudge scanner (which treats an old
// or null last_activity_at as overdue). Deploy time is used as each existing
// project's baseline instead of trying to reconstruct real historical activity.
exports.up = (knex) =>
  knex.raw(`
    UPDATE project
    SET last_activity_at = now()
    WHERE last_activity_at IS NULL
  `);

exports.down = (knex) =>
  knex.raw(`
    UPDATE project
    SET last_activity_at = NULL
  `);
