exports.up = (knex) =>
  knex.schema.alterTable('badge_unlock', (table) => {
    table.timestamp('created_at', { useTz: true }).notNullable();
    table.timestamp('updated_at', { useTz: true });
  });

exports.down = (knex) =>
  knex.schema.alterTable('badge_unlock', (table) => {
    table.dropColumn('created_at');
    table.dropColumn('updated_at');
  });
