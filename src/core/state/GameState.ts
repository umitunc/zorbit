export type GamePhase = 'loading' | 'menu' | 'playing' | 'gameover';

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  shakeIntensity: number;
}
