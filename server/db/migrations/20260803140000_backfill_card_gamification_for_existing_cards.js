// Cards created before the gamification feature shipped have no card_gamification row.
// Give them a default XP value so they behave like any other card going forward
// (completing one will award XP instead of silently no-oping).
const DEFAULT_BASE_XP = 10;

exports.up = (knex) =>
  knex.raw(
    `
      INSERT INTO card_gamification (id, card_id, base_xp, created_at)
      SELECT next_id(), card.id, ?, now()
      FROM card
      LEFT JOIN card_gamification ON card_gamification.card_id = card.id
      WHERE card_gamification.id IS NULL
    `,
    [DEFAULT_BASE_XP],
  );

exports.down = () => Promise.resolve();
