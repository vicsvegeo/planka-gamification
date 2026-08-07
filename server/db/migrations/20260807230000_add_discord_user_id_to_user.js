// Discord user ID for DM delivery via the notifications bot (see
// send-due-date-reminder.js). Nullable — most users won't set one, and
// dispatch falls back to Apprise until this is populated.
exports.up = (knex) =>
  knex.schema.alterTable('user_account', (table) => {
    table.string('discord_user_id');
  });

exports.down = (knex) =>
  knex.schema.alterTable('user_account', (table) => {
    table.dropColumn('discord_user_id');
  });
