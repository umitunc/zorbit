export type ParticleKind = 'star' | 'trail' | 'burst' | 'scorePopup';

export interface Particle {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  opacity: number;
  ageSec: number;
  lifetimeSec: number;
  angleRad: number;
  frame?: 0 | 1;
}
