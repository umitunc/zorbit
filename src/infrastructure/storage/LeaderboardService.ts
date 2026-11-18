import { AppConfig } from '../../core/config/AppConfig';
import defaultNames from '../../core/config/default-names.json';

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  username: string;
  score: number;
  isCurrentUser?: boolean;
}

export interface WeeklyArchiveGroup {
  weekId: string;
  label: string;
  winners: LeaderboardEntry[];
}

export interface WeeklyLeaderboardResponse {
  weekId: string;
  entries: LeaderboardEntry[];
  source: 'remote' | 'local';
}

export interface ArchiveLeaderboardResponse {
  weeks: WeeklyArchiveGroup[];
  source: 'remote' | 'local';
}

export interface UsernameUpdateResult {
  ok: boolean;
  username: string;
  error?: string;
}

const PLAYER_ID_KEY = 'zorbit_player_id';
const USERNAME_KEY = 'zorbit_username';
const BEST_SCORE_KEY = 'score_zorbit';
const PENDING_SYNC_KEY = 'zorbit_pending_sync';

interface PendingScoreSync {
  score: number;
  weekId: string;
  durationMs: number;
}

function generatePlayerId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `zp-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function defaultUsername(): string {
  const pool = defaultNames as string[];
  if (pool.length === 0) {
    return 'UzayPilotu';
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getIsoWeekId(date: Date = new Date()): string {
  const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export class LeaderboardService {
  private activeSession: { sessionId: string; nonce: string; startedAt: number } | null = null;
  private runStartedAt: number = Date.now();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        void this.syncPendingScore();
      });
    }
  }

  public getPlayerId(): string {
    let id = localStorage.getItem(PLAYER_ID_KEY);
    if (!id) {
      id = generatePlayerId();
      localStorage.setItem(PLAYER_ID_KEY, id);
    }
    return id;
  }

  public getUsername(): string {
    const existing = localStorage.getItem(USERNAME_KEY);
    if (existing && existing.trim().length >= 3) {
      return existing.trim();
    }
    const generated = defaultUsername();
    localStorage.setItem(USERNAME_KEY, generated);
    return generated;
  }

  public async ensureUniqueDefaultName(): Promise<string> {
    const current = this.getUsername();
    if (localStorage.getItem('zorbit_username_synced') === '1') {
      return current;
    }

    try {
      const res = await this.fetchWithTimeout(`${AppConfig.API_BASE_URL}/players/assign-default`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: this.getPlayerId(),
          baseName: current,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { username?: string };
        if (data.username) {
          localStorage.setItem(USERNAME_KEY, data.username);
          localStorage.setItem('zorbit_username_synced', '1');
          return data.username;
        }
      }
    } catch {
      // Offline mode: keep local default name until online
    }
    return current;
  }

  public async setUsername(rawName: string): Promise<UsernameUpdateResult> {
    const trimmed = rawName.trim();
    if (!/^[a-zA-Z0-9çğıöşüÇĞİÖŞÜ_-]{3,18}$/.test(trimmed)) {
      return {
        ok: false,
        username: this.getUsername(),
        error: '3-18 karakter, sadece harf, rakam, _ veya - kullanın.',
      };
    }

    const playerId = this.getPlayerId();
    try {
      const res = await this.fetchWithTimeout(`${AppConfig.API_BASE_URL}/players/username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, username: trimmed }),
      });

      if (res.status === 409) {
        return {
          ok: false,
          username: this.getUsername(),
          error: 'Bu oyuncu adı zaten alınmış. Başka bir ad deneyin.',
        };
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch {
      // Offline / backend not deployed yet: save locally so user can still personalize
    }

    localStorage.setItem(USERNAME_KEY, trimmed);
    localStorage.setItem('zorbit_username_synced', '1');
    return { ok: true, username: trimmed };
  }

  public async startSession(): Promise<void> {
    this.activeSession = null;
    this.runStartedAt = Date.now();
    const playerId = this.getPlayerId();
    try {
      const res = await this.fetchWithTimeout(`${AppConfig.API_BASE_URL}/sessions/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { sessionId?: string; nonce?: string };
      if (data.sessionId && data.nonce) {
        this.activeSession = {
          sessionId: data.sessionId,
          nonce: data.nonce,
          startedAt: this.runStartedAt,
        };
      }
    } catch {
      // Offline mode
    }
  }

  public async submitScore(score: number): Promise<void> {
    if (score <= 0) {
      return;
    }
    const cleanScore = Math.floor(score);
    const playerId = this.getPlayerId();
    const username = this.getUsername();
    const session = this.activeSession;
    const durationMs = Math.max(400, Date.now() - this.runStartedAt);
    this.activeSession = null;

    if (!session) {
      this.queuePendingScore(cleanScore, durationMs);
      return;
    }

    try {
      const res = await this.fetchWithTimeout(`${AppConfig.API_BASE_URL}/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          username,
          score: cleanScore,
          sessionId: session.sessionId,
          nonce: session.nonce,
          durationMs,
          appVersion: AppConfig.VERSION,
        }),
      });
      if (!res.ok) {
        this.queuePendingScore(cleanScore, durationMs);
      }
    } catch {
      this.queuePendingScore(cleanScore, durationMs);
    }
  }

  public async syncPendingScore(): Promise<void> {
    const raw = localStorage.getItem(PENDING_SYNC_KEY);
    if (!raw) return;

    let pending: PendingScoreSync;
    try {
      pending = JSON.parse(raw) as PendingScoreSync;
    } catch {
      localStorage.removeItem(PENDING_SYNC_KEY);
      return;
    }

    if (!pending || pending.score <= 0) {
      localStorage.removeItem(PENDING_SYNC_KEY);
      return;
    }

    try {
      const res = await this.fetchWithTimeout(`${AppConfig.API_BASE_URL}/scores/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: this.getPlayerId(),
          username: this.getUsername(),
          score: pending.score,
          weekId: pending.weekId,
          durationMs: pending.durationMs,
          appVersion: AppConfig.VERSION,
        }),
      });
      if (res.ok) {
        localStorage.removeItem(PENDING_SYNC_KEY);
      }
    } catch {
      // Still offline; keep pending score for next online event
    }
  }

  private queuePendingScore(score: number, durationMs: number): void {
    const weekId = getIsoWeekId();
    let existingScore = 0;
    try {
      const prev = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) ?? 'null') as PendingScoreSync | null;
      if (prev && prev.weekId === weekId) {
        existingScore = prev.score;
      }
    } catch {
      existingScore = 0;
    }

    if (score >= existingScore) {
      localStorage.setItem(
        PENDING_SYNC_KEY,
        JSON.stringify({ score, weekId, durationMs } satisfies PendingScoreSync)
      );
    }
  }

  public async getWeeklyLeaderboard(): Promise<WeeklyLeaderboardResponse> {
    const playerId = this.getPlayerId();
    const username = this.getUsername();
    const weekId = getIsoWeekId();

    try {
      const res = await this.fetchWithTimeout(
        `${AppConfig.API_BASE_URL}/leaderboard/weekly?weekId=${encodeURIComponent(weekId)}&playerId=${encodeURIComponent(playerId)}`
      );
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as { weekId?: string; entries?: LeaderboardEntry[] };
      return {
        weekId: data.weekId ?? weekId,
        entries: (data.entries ?? []).map((entry) => ({
          ...entry,
          isCurrentUser: entry.playerId === playerId,
        })),
        source: 'remote',
      };
    } catch {
      const best = Number.parseInt(localStorage.getItem(BEST_SCORE_KEY) ?? '0', 10) || 0;
      return {
        weekId,
        entries: [
          {
            rank: 1,
            playerId,
            username,
            score: best,
            isCurrentUser: true,
          },
        ],
        source: 'local',
      };
    }
  }

  public async getArchiveLeaderboard(): Promise<ArchiveLeaderboardResponse> {
    const playerId = this.getPlayerId();
    try {
      const res = await this.fetchWithTimeout(
        `${AppConfig.API_BASE_URL}/leaderboard/archive?playerId=${encodeURIComponent(playerId)}`
      );
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as { weeks?: WeeklyArchiveGroup[] };
      return {
        weeks: (data.weeks ?? []).map((week) => ({
          ...week,
          winners: week.winners.map((w) => ({
            ...w,
            isCurrentUser: w.playerId === playerId,
          })),
        })),
        source: 'remote',
      };
    } catch {
      return {
        weeks: [],
        source: 'local',
      };
    }
  }

  private async fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 3000);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      window.clearTimeout(timer);
    }
  }
}

