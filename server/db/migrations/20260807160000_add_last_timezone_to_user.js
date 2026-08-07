// Captures the user's IANA timezone as of their most recent login, since a
// static profile setting wouldn't track a user who moves between timezones.
// Nullable — populated lazily as clients start reporting it, so reminder
// scheduling must fall back to a default (e.g. UTC) when this is unset.
exports.up = (knex) =>
  knex.schema.alterTable('user_account', (table) => {
    table.string('last_timezone');
  });

exports.down = (knex) =>
  knex.schema.alterTable('user_account', (table) => {
    table.dropColumn('last_timezone');
  });
