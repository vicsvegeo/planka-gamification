// CI status indicator: the combined state of the GitHub Actions workflow runs
// for the latest commit on a card's branch (running / passed / failed), a link
// to the most relevant run, and the per-workflow runs it was combined from.
exports.up = (knex) =>
  knex.schema.alterTable('card', (table) => {
    table.text('github_ci_state');
    table.text('github_ci_url');
    table.jsonb('github_ci_runs');
  });

exports.down = (knex) =>
  knex.schema.alterTable('card', (table) => {
    table.dropColumn('github_ci_state');
    table.dropColumn('github_ci_url');
    table.dropColumn('github_ci_runs');
  });
