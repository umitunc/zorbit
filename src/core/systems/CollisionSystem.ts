import { GameConfig } from '../config/GameConfig';
import type { Planet } from '../entities/Planet';
import type { AttachmentEffect } from '../entities/PlanetAttachment';
import { circlesOverlap } from '../entities/Vector2';
import type { GameWorld } from '../state/GameWorld';

export interface AttachmentHit {
  effect: AttachmentEffect;
  x: number;
  y: number;
}

export interface CollisionResult {
  landedPlanet: Planet | null;
  attachmentHits: AttachmentHit[];
}

export class CollisionSystem {
  public check(world: GameWorld): CollisionResult {
    const rocketBounds = world.rocket.getBounds();
    const attachmentHits: AttachmentHit[] = [];

    // Check attachment collisions (Points & Enemies)
    for (const attachment of world.attachments) {
      if (attachment.collected) {
        continue;
      }
      if (circlesOverlap(rocketBounds, attachment.getBounds())) {
        const effect = attachment.onCollect();
        attachmentHits.push({
          effect,
          x: attachment.x,
          y: attachment.y,
        });
      }
    }

    if (attachmentHits.length > 0) {
      world.attachments = world.attachments.filter((item) => !item.collected);
    }

    // Check planet landing only when rocket is flying
    let landedPlanet: Planet | null = null;
    if (world.rocket.isFlying) {
      for (const planet of world.planets) {
        if (planet.active) {
          continue;
        }
        if (planet.opacity <= GameConfig.PLANET_LANDABLE_MIN_OPACITY) {
          continue;
        }
        if (circlesOverlap(rocketBounds, planet.getBounds())) {
          landedPlanet = planet;
          break;
        }
      }
    }

    return { landedPlanet, attachmentHits };
  }
}
