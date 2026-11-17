import { GameConfig } from '../config/GameConfig';
import type { IRandomProvider } from '../interfaces/IRandomProvider';
import type { GameWorld } from '../state/GameWorld';

export class ParticleSystem {
  private bgTimerSec: number = 0;
  private trailTimerSec: number = 0;

  constructor(private readonly random: IRandomProvider) {}

  public reset(): void {
    this.bgTimerSec = 0;
    this.trailTimerSec = 0;
  }

  public spawnBurst(world: GameWorld, x: number, y: number, count: number = 12): void {
    for (let i = 0; i < count; i++) {
      const angle = this.random.range(0, Math.PI * 2);
      const speed = this.random.range(120, 460);
      world.particles.push({
        kind: 'burst',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        scale: this.random.range(0.4, 1.0),
        opacity: 1,
        ageSec: 0,
        lifetimeSec: this.random.range(0.35, 0.7),
        angleRad: angle,
      });
    }
  }

  public spawnScorePopup(world: GameWorld, x: number, y: number, frame: 0 | 1): void {
    world.particles.push({
      kind: 'scorePopup',
      x,
      y,
      vx: 0,
      vy: -320,
      scale: 1,
      opacity: 1,
      ageSec: 0,
      lifetimeSec: 1.0,
      angleRad: 0,
      frame,
    });
  }

  public update(world: GameWorld, dt: number): void {
    this.bgTimerSec += dt;
    if (this.bgTimerSec >= GameConfig.BG_STAR_SPAWN_INTERVAL_SEC) {
      this.bgTimerSec -= GameConfig.BG_STAR_SPAWN_INTERVAL_SEC;
      this.spawnBackgroundStars(world);
    }

    if (world.rocket.isPinned) {
      this.trailTimerSec += dt;
      if (this.trailTimerSec >= GameConfig.ROCKET_TRAIL_SPAWN_INTERVAL_SEC) {
        this.trailTimerSec -= GameConfig.ROCKET_TRAIL_SPAWN_INTERVAL_SEC;
        world.particles.push({
          kind: 'trail',
          x: world.rocket.x,
          y: world.rocket.y,
          vx: 0,
          vy: 0,
          scale: 1,
          opacity: 0.9,
          ageSec: 0,
          lifetimeSec: 0.35,
          angleRad: world.rocket.angleRad,
        });
      }
    }

    for (const p of world.particles) {
      p.ageSec += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const progress = Math.min(1, p.ageSec / p.lifetimeSec);
      if (p.kind === 'star') {
        p.opacity = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
      } else {
        p.opacity = Math.max(0, 1 - progress);
      }
    }

    world.particles = world.particles.filter((p) => p.ageSec < p.lifetimeSec);
  }

  private spawnBackgroundStars(world: GameWorld): void {
    const offsets: Array<[number, number]> = [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
    for (const [sx, sy] of offsets) {
      world.particles.push({
        kind: 'star',
        x: world.rocket.x + sx * this.random.range(0, 3000),
        y: world.rocket.y + sy * this.random.range(0, 2000),
        vx: 0,
        vy: 0,
        scale: this.random.range(0.5, 1.5),
        opacity: 0,
        ageSec: 0,
        lifetimeSec: 2.0,
        angleRad: 0,
      });
    }
  }
}
