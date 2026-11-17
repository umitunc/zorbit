import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ?? 'postgres://zorbit:zorbit@zorbit-db:5432/zorbit',
});

export async function initDatabase(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      username_lower TEXT UNIQUE NOT NULL,
      platform TEXT NOT NULL DEFAULT 'web',
      push_token TEXT,
      best_score INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS weekly_scores (
      week_id TEXT NOT NULL,
      player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      score INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (week_id, player_id)
    );

    CREATE INDEX IF NOT EXISTS idx_weekly_scores_rank
      ON weekly_scores (week_id, score DESC, updated_at ASC);

    CREATE TABLE IF NOT EXISTS score_history (
      id SERIAL PRIMARY KEY,
      player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      week_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      duration_ms INTEGER NOT NULL,
      app_version TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}
