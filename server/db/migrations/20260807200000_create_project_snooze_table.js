// Per-user project snoozing: one row per (project, user) means "nudges for
// this project are silenced for this user until snoozed_until". Absence of a
// row means "not snoozed" — rows are upserted on renewal, never accumulated.
exports.up = (knex) =>
  knex.schema.createTable('project_snooze', (table) => {
    table.bigInteger('id').notNullable().primary().defaultTo(knex.raw('next_id()'));
    table
      .bigInteger('project_id')
      .notNullable()
      .references('id')
      .inTable('project')
      .onDelete('CASCADE');
    table
      .bigInteger('user_id')
      .notNullable()
      .references('id')
      .inTable('user_account')
      .onDelete('CASCADE');
    table.timestamp('snoozed_until', { useTz: true }).notNullable();

    table.unique(['project_id', 'user_id']);
  });

exports.down = (knex) => knex.schema.dropTableIfExists('project_snooze');
