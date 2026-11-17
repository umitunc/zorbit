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

    world.rocket.x += Math.cos(world.rocket.angleRad) * world.rocket.speed * dt;
    world.rocket.y += Math.sin(world.rocket.angleRad) * world.rocket.speed * dt;
    world.flightTimerSec += dt;

    return {
      timedOut: world.flightTimerSec >= GameConfig.FLIGHT_TIMEOUT_SEC,
    };
  }
}
