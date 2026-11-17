import { GameConfig } from '../config/GameConfig';
import type { Planet } from '../entities/Planet';
import type { GameWorld } from '../state/GameWorld';

export class DifficultySystem {
  public onPlanetLanded(world: GameWorld, landedPlanet: Planet): void {
    world.score += 1;

    if (world.difficultyDeg < GameConfig.MAX_DIFFICULTY_DEG) {
      world.difficultyDeg = Math.min(
        GameConfig.MAX_DIFFICULTY_DEG,
        world.difficultyDeg + GameConfig.DIFFICULTY_INCREMENT_DEG
      );
    }

    if (world.rocket.speed <= GameConfig.ROCKET_MAX_SPEED) {
      world.rocket.speed = Math.min(
        GameConfig.ROCKET_MAX_SPEED,
        world.rocket.speed + GameConfig.ROCKET_SPEED_INCREMENT
      );
    }

    if (world.score > GameConfig.PLANET_FADE_SCORE_THRESHOLD) {
      landedPlanet.startFadeOut(GameConfig.PLANET_FADE_DURATION_SEC);
    }
  }
}
