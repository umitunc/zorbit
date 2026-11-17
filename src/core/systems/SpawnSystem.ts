import { GameConfig } from '../config/GameConfig';
import { EnemyItem } from '../entities/EnemyItem';
import { Planet } from '../entities/Planet';
import { PointItem } from '../entities/PointItem';
import { degToRad } from '../entities/Vector2';
import type { IRandomProvider } from '../interfaces/IRandomProvider';
import type { GameWorld } from '../state/GameWorld';

export class SpawnSystem {
  constructor(private readonly random: IRandomProvider) {}

  public spawnNextPlanet(world: GameWorld): Planet {
    const directionSign = this.random.choose([-1, 1] as const);
    const xOffset = this.random.range(
      GameConfig.SPAWN_X_MIN_OFFSET,
      GameConfig.SPAWN_X_MAX_OFFSET
    );
    const yOffset = this.random.range(
      GameConfig.SPAWN_Y_MIN_OFFSET,
      GameConfig.SPAWN_Y_MAX_OFFSET
    );

    const scale = this.random.range(GameConfig.PLANET_MIN_SCALE, GameConfig.PLANET_MAX_SCALE);
    const radius = GameConfig.INITIAL_PLANET_RADIUS * scale;
    const rotDirection = this.random.choose([-1, 1] as const);
    const rotationSpeedRad = degToRad(world.difficultyDeg * rotDirection);

    const planet = new Planet({
      id: world.allocateId(),
      x: world.rocket.x + directionSign * xOffset,
      y: world.rocket.y - yOffset,
      radius,
      rotationSpeedRad,
      active: false,
    });

    world.planets.push(planet);

    if (world.score > 0) {
      this.spawnAttachmentsForPlanet(world, planet);
    }

    return planet;
  }

  public cleanupPassedPlanets(world: GameWorld): void {
    const cutoffY = world.rocket.y + GameConfig.PLANET_DESPAWN_Y_OFFSET;
    const removedIds = new Set<number>();

    world.planets = world.planets.filter((planet) => {
      if (!planet.active && planet.y > cutoffY && planet.id !== world.rocket.pinnedPlanetId) {
        removedIds.add(planet.id);
        return false;
      }
      if (planet.opacity <= 0) {
        removedIds.add(planet.id);
        return false;
      }
      return true;
    });

    if (removedIds.size > 0) {
      world.attachments = world.attachments.filter((att) => !removedIds.has(att.planetId));
    }
  }

  private spawnAttachmentsForPlanet(world: GameWorld, planet: Planet): void {
    const orbitDistance = planet.radius + GameConfig.ATTACHMENT_ORBIT_PADDING;

    if (world.score >= this.random.range(3, 20)) {
      world.attachments.push(
        new PointItem(world.allocateId(), planet.id, 0, orbitDistance)
      );
    }

    if (world.score >= this.random.range(14, 70)) {
      world.attachments.push(
        new PointItem(world.allocateId(), planet.id, Math.PI, orbitDistance)
      );
    }

    if (world.score >= this.random.range(8, 60)) {
      world.attachments.push(
        new EnemyItem(world.allocateId(), planet.id, Math.PI / 2, orbitDistance)
      );
    }

    if (world.score >= this.random.range(20, 90)) {
      world.attachments.push(
        new EnemyItem(world.allocateId(), planet.id, -Math.PI / 2, orbitDistance)
      );
    }
  }
}
