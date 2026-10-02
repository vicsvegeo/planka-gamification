// GitHub integration: each board can point at one repository (owner/repo) and
// the base branch new ticket branches are cut from (null means "main"). A card
// remembers the branch created for it so the UI can link to it.
exports.up = async (knex) => {
  await knex.schema.alterTable('board', (table) => {
    table.text('github_repo');
    table.text('github_base_branch');
  });

  await knex.schema.alterTable('card', (table) => {
    table.text('github_branch');
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable('card', (table) => {
    table.dropColumn('github_branch');
  });

  await knex.schema.alterTable('board', (table) => {
    table.dropColumn('github_repo');
    table.dropColumn('github_base_branch');
  });
};
