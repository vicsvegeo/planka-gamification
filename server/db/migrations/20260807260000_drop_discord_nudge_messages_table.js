// discord_nudge_messages existed to let a planned reaction-based snooze
// handler map a Discord message back to its project. That mechanism was
// abandoned in favor of snooze buttons, whose customId embeds the projectId
// directly — no message-ID lookup needed. Confirmed write-only (bot's
// logProjectNudgeMessage) with no reader anywhere in either repo before
// dropping. Safe to drop cleanly.
exports.up = (knex) => knex.schema.dropTableIfExists('discord_nudge_messages');

exports.down = (knex) =>
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
