import { GameConfig } from '../config/GameConfig';
import type { GameWorld } from '../state/GameWorld';

export interface OrbitUpdateResult {
  pinnedPlanetExpired: boolean;
}

export class OrbitSystem {
  public update(world: GameWorld, dt: number): OrbitUpdateResult {
    let pinnedPlanetExpired = false;

    for (const planet of world.planets) {
      planet.angleRad += planet.rotationSpeedRad * dt;
      planet.updateFade(dt);
    }

    if (world.rocket.isPinned) {
      const hostPlanet = world.getPlanetById(world.rocket.pinnedPlanetId);
      if (hostPlanet) {
        const deltaAngle = hostPlanet.rotationSpeedRad * dt;
        world.rocket.orbitAngleRad += deltaAngle;
        world.rocket.angleRad = world.rocket.orbitAngleRad;

        const orbitDistance = hostPlanet.radius + GameConfig.ROCKET_ORBIT_OFFSET;
        world.rocket.x = hostPlanet.x + Math.cos(world.rocket.orbitAngleRad) * orbitDistance;
        world.rocket.y = hostPlanet.y + Math.sin(world.rocket.orbitAngleRad) * orbitDistance;

        if (hostPlanet.active && hostPlanet.opacity <= GameConfig.PLANET_EXPIRE_OPACITY) {
          hostPlanet.active = false;
          pinnedPlanetExpired = true;
        }
      }
    }

    for (const attachment of world.attachments) {
      const planet = world.getPlanetById(attachment.planetId);
      if (!planet) {
        continue;
      }
      const orbitAngle = planet.angleRad + attachment.localAngleOffsetRad;
      attachment.x = planet.x + Math.cos(orbitAngle) * attachment.orbitDistance;
      attachment.y = planet.y + Math.sin(orbitAngle) * attachment.orbitDistance;
      attachment.angleRad += attachment.spinSpeedRad * dt;
    }

    return { pinnedPlanetExpired };
  }
}
