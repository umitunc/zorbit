import { describe, expect, it } from 'vitest';
import { GameConfig } from '../src/core/config/GameConfig';
import { Planet } from '../src/core/entities/Planet';
import { PointItem } from '../src/core/entities/PointItem';
import { degToRad } from '../src/core/entities/Vector2';
import { GameWorld } from '../src/core/state/GameWorld';
import { OrbitSystem } from '../src/core/systems/OrbitSystem';

describe('OrbitSystem', () => {
  it('rotates pinned rocket around its host planet', () => {
    const world = new GameWorld();
    world.resetForNewRun();

    const planet = new Planet({
      id: 99,
      x: 500,
      y: 1000,
      radius: 200,
      rotationSpeedRad: degToRad(90),
      active: true,
    });
    world.planets = [planet];
    world.rocket.pinToPlanet(99, 0);

    const orbit = new OrbitSystem();
    orbit.update(world, 1.0); // 90 deg rotation

    expect(world.rocket.angleRad).toBeCloseTo(Math.PI / 2, 5);
    expect(world.rocket.x).toBeCloseTo(500, 3);
    expect(world.rocket.y).toBeCloseTo(1000 + 200 + GameConfig.ROCKET_ORBIT_OFFSET, 3);
  });

  it('rotates attached items with the planet and allows unlimited orbiting', () => {
    const world = new GameWorld();
    world.resetForNewRun();

    const planet = world.planets[0];
    planet.rotationSpeedRad = degToRad(180);

    const point = new PointItem(50, planet.id, 0, planet.radius + 65);
    world.attachments.push(point);

    const orbit = new OrbitSystem();
    const res1 = orbit.update(world, 0.5);
    expect(res1.pinnedPlanetExpired).toBe(false);
    expect(point.x).toBeCloseTo(planet.x, 3);
    expect(point.y).toBeCloseTo(planet.y + (planet.radius + 65), 3);

    const res2 = orbit.update(world, 10.0);
    expect(res2.pinnedPlanetExpired).toBe(false);
  });
});
