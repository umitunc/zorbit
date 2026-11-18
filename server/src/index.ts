import { randomBytes, randomUUID } from 'node:crypto';
import cors from '@fastify/cors';
import Fastify from 'fastify';
import { Redis } from 'ioredis';
import { initDatabase, pool } from './db.js';

const PORT = Number(process.env.PORT ?? 4100);
const REDIS_URL = process.env.REDIS_URL ?? 'redis://zorbit-redis:6379';
const SESSION_TTL_SEC = 3600;
const NOTIF_COOLDOWN_SEC = 3600;
const USERNAME_REGEX = /^[a-zA-Z0-9çğıöşüÇĞİÖŞÜ_-]{3,18}$/;

const redis = new Redis(REDIS_URL);

function getIsoWeekId(date: Date = new Date()): string {
  const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function formatWeekLabel(weekId: string): string {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekId);
  if (!match) return weekId;
  return `${match[1]} • ${Number(match[2])}. Hafta`;
}

async function ensurePlayer(playerId: string, username?: string): Promise<void> {
  const safeName =
    username && USERNAME_REGEX.test(username.trim())
      ? username.trim()
      : `ZorbitPlayer-${playerId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || '0001'}`;

  await pool.query(
    `
      INSERT INTO players (id, username, username_lower)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO NOTHING
    `,
    [playerId, safeName, safeName.toLowerCase()]
  );
}

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: [
    'https://zorbit.truncgil.com',
    'https://zorbit.truncgil.com.tr',
    'capacitor://localhost',
    'http://localhost',
    'http://localhost:5173',
  ],
});

app.get('/api/health', async () => {
  await pool.query('SELECT 1');
  await redis.ping();
  return { ok: true, db: 'ok', redis: 'ok', weekId: getIsoWeekId() };
});

app.post<{ Body: { playerId?: string } }>('/api/sessions/start', async (request, reply) => {
  const playerId = request.body?.playerId?.trim();
  if (!playerId || playerId.length < 4 || playerId.length > 80) {
    return reply.code(400).send({ error: 'Invalid playerId' });
  }

  const sessionId = randomUUID();
  const nonce = randomBytes(16).toString('hex');
  const payload = JSON.stringify({
    playerId,
    nonce,
    startedAt: Date.now(),
  });

  await redis.set(`session:${sessionId}`, payload, 'EX', SESSION_TTL_SEC);
  return { sessionId, nonce };
});

app.post<{ Body: { playerId?: string; username?: string; platform?: string } }>(
  '/api/players/username',
  async (request, reply) => {
    const playerId = request.body?.playerId?.trim();
    const username = request.body?.username?.trim();
    const platform = request.body?.platform?.trim() || 'web';

    if (!playerId || !username || !USERNAME_REGEX.test(username)) {
      return reply.code(400).send({ error: 'Geçersiz oyuncu adı veya kimlik.' });
    }

    const lower = username.toLowerCase();
    const existing = await pool.query<{ id: string }>(
      'SELECT id FROM players WHERE username_lower = $1',
      [lower]
    );

    if (existing.rows.length > 0 && existing.rows[0].id !== playerId) {
      return reply.code(409).send({ error: 'Bu oyuncu adı zaten alınmış.' });
    }

    await pool.query(
      `
        INSERT INTO players (id, username, username_lower, platform)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE
          SET username = EXCLUDED.username,
              username_lower = EXCLUDED.username_lower,
              platform = EXCLUDED.platform,
              updated_at = NOW()
      `,
      [playerId, username, lower, platform]
    );

    return { ok: true, username };
  }
);

app.post<{ Body: { playerId?: string; baseName?: string; platform?: string } }>(
  '/api/players/assign-default',
  async (request, reply) => {
    const playerId = request.body?.playerId?.trim();
    const rawBase = request.body?.baseName?.trim() || 'UzayPilotu';
    const platform = request.body?.platform?.trim() || 'web';

    if (!playerId || playerId.length < 4 || playerId.length > 80) {
      return reply.code(400).send({ error: 'Invalid playerId' });
    }

    const existingPlayer = await pool.query<{ username: string }>(
      'SELECT username FROM players WHERE id = $1',
      [playerId]
    );
    if (existingPlayer.rows.length > 0) {
      return { ok: true, username: existingPlayer.rows[0].username };
    }

    const baseClean = USERNAME_REGEX.test(rawBase) ? rawBase.slice(0, 15) : 'UzayPilotu';
    let candidate = baseClean;
    let seq = 1;

    while (seq < 10000) {
      const taken = await pool.query(
        'SELECT 1 FROM players WHERE username_lower = $1',
        [candidate.toLowerCase()]
      );
      if (taken.rows.length === 0) {
        await pool.query(
          `
            INSERT INTO players (id, username, username_lower, platform)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO NOTHING
          `,
          [playerId, candidate, candidate.toLowerCase(), platform]
        );
        return { ok: true, username: candidate };
      }
      seq++;
      const suffix = String(seq);
      candidate = `${baseClean.slice(0, 18 - suffix.length)}${suffix}`;
    }

    return reply.code(409).send({ error: 'Benzersiz isim üretilemedi.' });
  }
);

app.post<{
  Body: {
    playerId?: string;
    username?: string;
    score?: number;
    sessionId?: string;
    nonce?: string;
    durationMs?: number;
    appVersion?: string;
  };
}>('/api/scores', async (request, reply) => {
  const { playerId, username, score, sessionId, nonce, durationMs, appVersion } = request.body ?? {};

  if (!playerId || typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 50000) {
    return reply.code(400).send({ error: 'Geçersiz skor verisi.' });
  }

  const cleanScore = Math.floor(score);
  if (cleanScore === 0) {
    return { ok: true, skipped: true };
  }

  if (!sessionId || !nonce) {
    return reply.code(401).send({ error: 'Oturum doğrulaması eksik.' });
  }

  const rawSession = await redis.getdel(`session:${sessionId}`);
  if (!rawSession) {
    return reply.code(401).send({ error: 'Geçersiz veya kullanılmış oyun oturumu.' });
  }

  const session = JSON.parse(rawSession) as {
    playerId: string;
    nonce: string;
    startedAt: number;
  };

  if (session.playerId !== playerId || session.nonce !== nonce) {
    return reply.code(403).send({ error: 'Oturum imzası uyuşmuyor.' });
  }

  const elapsedMs = Date.now() - session.startedAt;
  const reportedDuration = typeof durationMs === 'number' && durationMs > 0 ? durationMs : elapsedMs;
  const minPlausibleMs = Math.max(400, cleanScore * 120);
  if (elapsedMs < minPlausibleMs || reportedDuration < minPlausibleMs * 0.8) {
    return reply.code(422).send({ error: 'Skor/süre tutarlılık kontrolünden geçemedi.' });
  }

  await ensurePlayer(playerId, username);
  const weekId = getIsoWeekId();

  const prevRow = await pool.query<{ score: number }>(
    'SELECT score FROM weekly_scores WHERE week_id = $1 AND player_id = $2',
    [weekId, playerId]
  );
  const prevWeeklyScore = prevRow.rows[0]?.score ?? 0;

  await pool.query(
    `
      UPDATE players
      SET best_score = GREATEST(best_score, $2),
          updated_at = NOW()
      WHERE id = $1
    `,
    [playerId, cleanScore]
  );

  await pool.query(
    `
      INSERT INTO weekly_scores (week_id, player_id, score)
      VALUES ($1, $2, $3)
      ON CONFLICT (week_id, player_id) DO UPDATE
        SET score = GREATEST(weekly_scores.score, EXCLUDED.score),
            updated_at = CASE
              WHEN EXCLUDED.score > weekly_scores.score THEN NOW()
              ELSE weekly_scores.updated_at
            END
    `,
    [weekId, playerId, cleanScore]
  );

  await pool.query(
    `
      INSERT INTO score_history (player_id, week_id, score, duration_ms, app_version)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [playerId, weekId, cleanScore, Math.floor(elapsedMs), appVersion ?? null]
  );

  let surpassedCount = 0;
  if (cleanScore > prevWeeklyScore) {
    const surpassed = await pool.query<{ player_id: string; push_token: string | null }>(
      `
        SELECT ws.player_id, p.push_token
        FROM weekly_scores ws
        JOIN players p ON p.id = ws.player_id
        WHERE ws.week_id = $1
          AND ws.player_id <> $2
          AND ws.score >= $3
          AND ws.score < $4
      `,
      [weekId, playerId, prevWeeklyScore, cleanScore]
    );
    surpassedCount = surpassed.rows.length;

    for (const rival of surpassed.rows) {
      if (!rival.push_token) continue;
      const cooldownKey = `notif:cooldown:${rival.player_id}`;
      const locked = await redis.set(cooldownKey, '1', 'EX', NOTIF_COOLDOWN_SEC, 'NX');
      if (locked) {
        app.log.info(
          { rivalId: rival.player_id, by: playerId, score: cleanScore },
          'Queued rival-surpassed notification'
        );
      }
    }
  }

  return { ok: true, weekId, score: cleanScore, surpassedCount };
});

app.post<{
  Body: {
    playerId?: string;
    username?: string;
    score?: number;
    weekId?: string;
    durationMs?: number;
    appVersion?: string;
  };
}>('/api/scores/sync', async (request, reply) => {
  const { playerId, username, score, weekId, durationMs, appVersion } = request.body ?? {};
  if (!playerId || typeof score !== 'number' || !Number.isFinite(score) || score <= 0 || score > 50000) {
    return reply.code(400).send({ error: 'Geçersiz offline skor verisi.' });
  }

  const cleanScore = Math.floor(score);
  const targetWeek = weekId && /^\d{4}-W\d{2}$/.test(weekId) ? weekId : getIsoWeekId();
  const minPlausibleMs = Math.max(400, cleanScore * 120);
  const cleanDuration = typeof durationMs === 'number' && durationMs >= minPlausibleMs ? Math.floor(durationMs) : minPlausibleMs;

  await ensurePlayer(playerId, username);

  await pool.query(
    `
      UPDATE players
      SET best_score = GREATEST(best_score, $2),
          updated_at = NOW()
      WHERE id = $1
    `,
    [playerId, cleanScore]
  );

  await pool.query(
    `
      INSERT INTO weekly_scores (week_id, player_id, score)
      VALUES ($1, $2, $3)
      ON CONFLICT (week_id, player_id) DO UPDATE
        SET score = GREATEST(weekly_scores.score, EXCLUDED.score),
            updated_at = CASE
              WHEN EXCLUDED.score > weekly_scores.score THEN NOW()
              ELSE weekly_scores.updated_at
            END
    `,
    [targetWeek, playerId, cleanScore]
  );

  await pool.query(
    `
      INSERT INTO score_history (player_id, week_id, score, duration_ms, app_version)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [playerId, targetWeek, cleanScore, cleanDuration, appVersion ?? null]
  );

  return { ok: true, weekId: targetWeek, score: cleanScore, synced: true };
});

app.get<{ Querystring: { weekId?: string; playerId?: string } }>(
  '/api/leaderboard/weekly',
  async (request) => {
    const weekId = request.query.weekId?.trim() || getIsoWeekId();
    const playerId = request.query.playerId?.trim();

    const topRes = await pool.query<{
      rank: string;
      playerId: string;
      username: string;
      score: number;
    }>(
      `
        SELECT
          ROW_NUMBER() OVER (ORDER BY ws.score DESC, ws.updated_at ASC) AS rank,
          ws.player_id AS "playerId",
          p.username,
          ws.score
        FROM weekly_scores ws
        JOIN players p ON p.id = ws.player_id
        WHERE ws.week_id = $1
        ORDER BY ws.score DESC, ws.updated_at ASC
        LIMIT 50
      `,
      [weekId]
    );

    const entries = topRes.rows.map((r) => ({
      rank: Number(r.rank),
      playerId: r.playerId,
      username: r.username,
      score: r.score,
    }));

    if (playerId && !entries.some((e) => e.playerId === playerId)) {
      const meRes = await pool.query<{
        rank: string;
        playerId: string;
        username: string;
        score: number;
      }>(
        `
          SELECT rank, "playerId", username, score FROM (
            SELECT
              ROW_NUMBER() OVER (ORDER BY ws.score DESC, ws.updated_at ASC) AS rank,
              ws.player_id AS "playerId",
              p.username,
              ws.score
            FROM weekly_scores ws
            JOIN players p ON p.id = ws.player_id
            WHERE ws.week_id = $1
          ) ranked
          WHERE "playerId" = $2
        `,
        [weekId, playerId]
      );
      if (meRes.rows[0]) {
        entries.push({
          rank: Number(meRes.rows[0].rank),
          playerId: meRes.rows[0].playerId,
          username: meRes.rows[0].username,
          score: meRes.rows[0].score,
        });
      }
    }

    return { weekId, entries };
  }
);

app.get('/api/leaderboard/archive', async () => {
  const currentWeek = getIsoWeekId();
  const res = await pool.query<{
    weekId: string;
    rank: string;
    playerId: string;
    username: string;
    score: number;
  }>(
    `
      SELECT "weekId", rank, "playerId", username, score FROM (
        SELECT
          ws.week_id AS "weekId",
          ROW_NUMBER() OVER (PARTITION BY ws.week_id ORDER BY ws.score DESC, ws.updated_at ASC) AS rank,
          ws.player_id AS "playerId",
          p.username,
          ws.score
        FROM weekly_scores ws
        JOIN players p ON p.id = ws.player_id
        WHERE ws.week_id < $1
      ) ranked
      WHERE rank <= 3
      ORDER BY "weekId" DESC, rank ASC
      LIMIT 36
    `,
    [currentWeek]
  );

  const grouped = new Map<
    string,
    { weekId: string; label: string; winners: Array<{ rank: number; playerId: string; username: string; score: number }> }
  >();

  for (const row of res.rows) {
    let group = grouped.get(row.weekId);
    if (!group) {
      group = {
        weekId: row.weekId,
        label: formatWeekLabel(row.weekId),
        winners: [],
      };
      grouped.set(row.weekId, group);
    }
    group.winners.push({
      rank: Number(row.rank),
      playerId: row.playerId,
      username: row.username,
      score: row.score,
    });
  }

  return { weeks: Array.from(grouped.values()) };
});

await initDatabase();
await app.listen({ port: PORT, host: '0.0.0.0' });
