import { describe, expect, it } from 'vitest';
import { GameConfig } from '../src/core/config/GameConfig';
import { EnemyItem } from '../src/core/entities/EnemyItem';
import { Planet } from '../src/core/entities/Planet';
import { PointItem } from '../src/core/entities/PointItem';
import { GameWorld } from '../src/core/state/GameWorld';
import { CollisionSystem } from '../src/core/systems/CollisionSystem';

describe('CollisionSystem', () => {
  it('lands rocket on an unvisited planet with sufficient opacity', () => {
    const world = new GameWorld();
    world.resetForNewRun();

    const target = world.planets[1];
    world.rocket.launch();
    world.rocket.x = target.x;
    world.rocket.y = target.y + target.radius;

    const collision = new CollisionSystem();
    const result = collision.check(world);

    expect(result.landedPlanet?.id).toBe(target.id);
  });

  it('ignores planets whose opacity is <= 75%', () => {
    const world = new GameWorld();
    world.resetForNewRun();

    const target = world.planets[1];
    target.opacity = GameConfig.PLANET_LANDABLE_MIN_OPACITY;
    world.rocket.launch();
    world.rocket.x = target.x;
    world.rocket.y = target.y;

    const collision = new CollisionSystem();
    const result = collision.check(world);

    expect(result.landedPlanet).toBeNull();
  });

  it('collects Point (+3) and Enemy (-3) attachments', () => {
    const world = new GameWorld();
    world.resetForNewRun();
    const planet = new Planet({
      id: 10,
      x: 0,
      y: 0,
      radius: 100,
      rotationSpeedRad: 0,
    });
    world.planets.push(planet);

    const point = new PointItem(11, 10, 0, 165);
    point.x = 200;
    point.y = 200;

    const enemy = new EnemyItem(12, 10, Math.PI, 165);
    enemy.x = 600;
    enemy.y = 600;

    world.attachments.push(point, enemy);
    world.rocket.x = 200;
    world.rocket.y = 200;

    const collision = new CollisionSystem();
    const result = collision.check(world);

    expect(result.attachmentHits).toHaveLength(1);
    expect(result.attachmentHits[0].effect.scoreDelta).toBe(GameConfig.POINT_SCORE_BONUS);
    expect(world.attachments).toHaveLength(1);
    expect(world.attachments[0].id).toBe(12);
  });
});
