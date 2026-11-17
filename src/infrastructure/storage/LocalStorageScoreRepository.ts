import type { IScoreRepository } from '../../core/interfaces/IScoreRepository';

const BEST_SCORE_KEY = 'score_zorbit';

export class LocalStorageScoreRepository implements IScoreRepository {
  public async getBestScore(): Promise<number> {
    const raw = localStorage.getItem(BEST_SCORE_KEY);
    if (!raw) {
      return 0;
    }
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  public async saveBestScore(score: number): Promise<void> {
    const current = await this.getBestScore();
    if (score > current) {
      localStorage.setItem(BEST_SCORE_KEY, String(Math.floor(score)));
    }
  }
}
