import { GameConfig } from '../config/GameConfig';
import type { GameWorld } from '../state/GameWorld';

export interface FlightUpdateResult {
  timedOut: boolean;
}

export class FlightSystem {
  public update(world: GameWorld, dt: number): FlightUpdateResult {
    if (!world.rocket.isFlying) {
      return { timedOut: false };
    }

    const vx = Math.cos(world.rocket.angleRad);
    const vy = Math.sin(world.rocket.angleRad);

    world.rocket.x += vx * world.rocket.speed * dt;
    world.rocket.y += vy * world.rocket.speed * dt;
    world.flightTimerSec += dt;

    if (world.flightTimerSec >= GameConfig.FLIGHT_TIMEOUT_SEC) {
      return { timedOut: true };
    }

    if (world.flightTimerSec >= GameConfig.FLIGHT_MIN_MISS_CHECK_SEC) {
      const hasTargetAhead = world.planets.some((planet) => {
        if (planet.active || planet.opacity < GameConfig.PLANET_LANDABLE_MIN_OPACITY) {
          return false;
        }
        const dx = planet.x - world.rocket.x;
        const dy = planet.y - world.rocket.y;
        return dx * vx + dy * vy >= -planet.radius;
      });

      if (!hasTargetAhead) {
        return { timedOut: true };
      }
    }

    return { timedOut: false };
  }
}
