// The GitHub repository (owner/repo) and base branch move from boards to
// projects: one repository per project. A project takes the settings of its
// first board (in board order) that has a repository.
exports.up = async (knex) => {
  await knex.schema.alterTable('project', (table) => {
    table.text('github_repo');
    table.text('github_base_branch');
  });

  await knex.raw(`
    UPDATE project
    SET github_repo = first_board.github_repo,
        github_base_branch = first_board.github_base_branch
    FROM (
      SELECT DISTINCT ON (project_id) project_id, github_repo, github_base_branch
      FROM board
      WHERE github_repo IS NOT NULL
      ORDER BY project_id, position, id
    ) AS first_board
    WHERE project.id = first_board.project_id
  `);

  await knex.schema.alterTable('board', (table) => {
    table.dropColumn('github_repo');
    table.dropColumn('github_base_branch');
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable('board', (table) => {
    table.text('github_repo');
    table.text('github_base_branch');
  });

  await knex.raw(`
    UPDATE board
    SET github_repo = project.github_repo,
        github_base_branch = project.github_base_branch
    FROM project
    WHERE board.project_id = project.id
  `);

  await knex.schema.alterTable('project', (table) => {
    table.dropColumn('github_repo');
    table.dropColumn('github_base_branch');
  });
};
