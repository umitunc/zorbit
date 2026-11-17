export interface IScoreRepository {
  getBestScore(): Promise<number>;
  saveBestScore(score: number): Promise<void>;
}
