import { describe, expect, it } from 'vitest';
import { GameConfig } from '../src/core/config/GameConfig';
import type { IRandomProvider } from '../src/core/interfaces/IRandomProvider';
import { GameWorld } from '../src/core/state/GameWorld';
import { DifficultySystem } from '../src/core/systems/DifficultySystem';
import { SpawnSystem } from '../src/core/systems/SpawnSystem';

class FixedRandom implements IRandomProvider {
  range(min: number, max: number): number {
    return (min + max) / 2;
  }
  choose<T>(items: readonly T[]): T {
    return items[0];
  }
}

describe('DifficultySystem & SpawnSystem', () => {
  it('scales difficulty and rocket speed up to configured caps', () => {
    const world = new GameWorld();
    world.resetForNewRun();
    const difficulty = new DifficultySystem();

    for (let i = 0; i < 100; i++) {
      difficulty.onPlanetLanded(world);
    }

    expect(world.score).toBe(100);
    expect(world.difficultyDeg).toBe(GameConfig.MAX_DIFFICULTY_DEG);
    expect(world.rocket.speed).toBe(GameConfig.ROCKET_MAX_SPEED);
    expect(world.planets[1].isFadingOut).toBe(false);
  });

  it('spawns next planet above the rocket and cleans up passed planets', () => {
    const world = new GameWorld();
    world.resetForNewRun();
    world.score = 100;

    const spawn = new SpawnSystem(new FixedRandom());
    const spawned = spawn.spawnNextPlanet(world);

    expect(spawned.y).toBeLessThan(world.rocket.y);
    expect(world.attachments.length).toBeGreaterThan(0);

    // Move rocket far above old planet
    world.rocket.y = -2000;
    spawn.cleanupPassedPlanets(world);
    expect(world.planets.some((p) => p.y > world.rocket.y + GameConfig.PLANET_DESPAWN_Y_OFFSET && !p.active)).toBe(false);
  });
});
