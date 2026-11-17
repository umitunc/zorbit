import { AppConfig } from '../../core/config/AppConfig';

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

function generatePlayerId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `zp-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function defaultUsername(playerId: string): string {
  const suffix = playerId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || '0001';
  return `ZorbitPlayer-${suffix}`;
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
    const generated = defaultUsername(this.getPlayerId());
    localStorage.setItem(USERNAME_KEY, generated);
    return generated;
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
    return { ok: true, username: trimmed };
  }

  public async submitScore(score: number): Promise<void> {
    if (score <= 0) {
      return;
    }
    const playerId = this.getPlayerId();
    const username = this.getUsername();
    try {
      await this.fetchWithTimeout(`${AppConfig.API_BASE_URL}/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          username,
          score: Math.floor(score),
          weekId: getIsoWeekId(),
          appVersion: AppConfig.VERSION,
          versionCode: AppConfig.VERSION_CODE,
        }),
      });
    } catch {
      // Silently ignore when offline; localStorage keeps local best score
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

