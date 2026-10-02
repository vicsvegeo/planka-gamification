// PR state badge: the state of the work on a card's branch as reported by
// GitHub webhooks (branch / open / merged / closed) and the PR it refers to.
exports.up = (knex) =>
  knex.schema.alterTable('card', (table) => {
    table.text('github_pr_state');
    table.integer('github_pr_number');
    table.text('github_pr_url');
  });

exports.down = (knex) =>
  knex.schema.alterTable('card', (table) => {
    table.dropColumn('github_pr_state');
    table.dropColumn('github_pr_number');
    table.dropColumn('github_pr_url');
  });
