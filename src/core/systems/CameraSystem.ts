import { GameConfig } from '../config/GameConfig';
import type { GameWorld } from '../state/GameWorld';

export class CameraSystem {
  public update(world: GameWorld, dt: number): void {
    const targetX = world.rocket.x;
    const targetY = world.rocket.y + GameConfig.CAMERA_Y_OFFSET;

    // Smooth camera follow
    const followLerp = Math.min(1, dt * 10);
    world.camera.x += (targetX - world.camera.x) * followLerp;
    world.camera.y += (targetY - world.camera.y) * followLerp;

    // Dynamic zoom: zoom out while pinned (0.7), zoom in while flying (1.4)
    if (world.rocket.isPinned) {
      world.camera.zoom = Math.max(
        GameConfig.CAMERA_MIN_ZOOM,
        world.camera.zoom - GameConfig.CAMERA_ZOOM_STEP_PER_SEC * dt
      );
    } else {
      world.camera.zoom = Math.min(
        GameConfig.CAMERA_MAX_ZOOM,
        world.camera.zoom + GameConfig.CAMERA_ZOOM_STEP_PER_SEC * dt
      );
    }

    if (world.camera.shakeIntensity > 0) {
      world.camera.shakeIntensity = Math.max(0, world.camera.shakeIntensity - dt * 60);
    }
  }
}
