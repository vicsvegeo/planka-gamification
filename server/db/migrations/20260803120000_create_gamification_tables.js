exports.up = (knex) =>
  knex.schema
    // Per-user XP / level tracking. One row per user_account.
    .createTable('user_stats', (table) => {
      table.bigInteger('id').notNullable().primary().defaultTo(knex.raw('next_id()'));
      table
        .bigInteger('user_id')
        .notNullable()
        .unique()
        .references('id')
        .inTable('user_account')
        .onDelete('CASCADE');
      table.integer('xp').notNullable().defaultTo(0);
      table.integer('level').notNullable().defaultTo(1);
      table.integer('on_time_completions').notNullable().defaultTo(0);
      table.integer('total_completions').notNullable().defaultTo(0);
      table.timestamp('created_at', { useTz: true }).notNullable();
      table.timestamp('updated_at', { useTz: true });
    })

    // Gamification metadata attached to a card. One row per card, created lazily.
    .createTable('card_gamification', (table) => {
      table.bigInteger('id').notNullable().primary().defaultTo(knex.raw('next_id()'));
      table
        .bigInteger('card_id')
        .notNullable()
        .unique()
        .references('id')
        .inTable('card')
        .onDelete('CASCADE');
      table.integer('base_xp').notNullable();
      table.timestamp('soft_due_date', { useTz: true });
      table.boolean('bonus_awarded').notNullable().defaultTo(false);
      // Guards against re-awarding base XP if a card is reopened and re-closed.
      table.boolean('xp_awarded').notNullable().defaultTo(false);
      table.timestamp('created_at', { useTz: true }).notNullable();
      table.timestamp('updated_at', { useTz: true });
    })

    // Badge catalog — the set of badges that exist and their unlock rule id.
    // Rule logic itself lives in code (see badge engine ticket); this table
    // just lets unlocks reference a stable badge identity.
    .createTable('badge', (table) => {
      table.bigInteger('id').notNullable().primary().defaultTo(knex.raw('next_id()'));
      table.string('slug').notNullable().unique(); // e.g. 'first_blood', 'level_5'
      table.string('name').notNullable();
      table.text('description');
      table.string('icon');
      table.timestamp('created_at', { useTz: true }).notNullable();
      table.timestamp('updated_at', { useTz: true });
    })

    // Unlock records — one row per (user, badge) the first time it's earned.
    .createTable('badge_unlock', (table) => {
      table.bigInteger('id').notNullable().primary().defaultTo(knex.raw('next_id()'));
      table
        .bigInteger('user_id')
        .notNullable()
        .references('id')
        .inTable('user_account')
        .onDelete('CASCADE');
      table
        .bigInteger('badge_id')
        .notNullable()
        .references('id')
        .inTable('badge')
        .onDelete('CASCADE');
      table.timestamp('unlocked_at', { useTz: true }).notNullable();
      table.unique(['user_id', 'badge_id']);
    });

exports.down = (knex) =>
  knex.schema
    .dropTableIfExists('badge_unlock')
    .dropTableIfExists('badge')
    .dropTableIfExists('card_gamification')
    .dropTableIfExists('user_stats');
