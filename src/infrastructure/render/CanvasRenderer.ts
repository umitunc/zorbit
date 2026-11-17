import { GameConfig } from '../../core/config/GameConfig';
import type { IRenderer } from '../../core/interfaces/IRenderer';
import type { GameWorld } from '../../core/state/GameWorld';
import type { GameImages } from './AssetLoader';

export class CanvasRenderer implements IRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private viewportWidth: number = GameConfig.VIRTUAL_WIDTH;
  private viewportHeight: number = GameConfig.VIRTUAL_HEIGHT;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly images: GameImages
  ) {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not initialize 2D canvas context');
    }
    this.ctx = context;
  }

  public resize(width: number, height: number): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  public render(world: GameWorld): void {
    const ctx = this.ctx;
    ctx.save();

    // Space background
    ctx.fillStyle = '#070913';
    ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);

    if (world.phase === 'loading' || world.phase === 'menu') {
      ctx.restore();
      return;
    }

    // Scale virtual 1080x1920 to current viewport
    const scaleX = this.viewportWidth / GameConfig.VIRTUAL_WIDTH;
    const scaleY = this.viewportHeight / GameConfig.VIRTUAL_HEIGHT;
    const fitScale = Math.min(scaleX, scaleY * 1.25);

    const shakeX =
      world.camera.shakeIntensity > 0
        ? (Math.random() - 0.5) * world.camera.shakeIntensity
        : 0;
    const shakeY =
      world.camera.shakeIntensity > 0
        ? (Math.random() - 0.5) * world.camera.shakeIntensity
        : 0;

    ctx.translate(this.viewportWidth / 2 + shakeX, this.viewportHeight / 2 + shakeY);
    ctx.scale(fitScale * world.camera.zoom, fitScale * world.camera.zoom);
    ctx.translate(-world.camera.x, -world.camera.y);

    this.drawParticles(world, 'star');
    this.drawParticles(world, 'trail');
    this.drawPlanets(world);
    this.drawAttachments(world);
    this.drawRocket(world);
    this.drawParticles(world, 'burst');
    this.drawScorePopups(world);

    ctx.restore();
  }

  private drawPlanets(world: GameWorld): void {
    const ctx = this.ctx;
    for (const planet of world.planets) {
      if (planet.opacity <= 0) {
        continue;
      }
      ctx.save();
      ctx.globalAlpha = planet.opacity;
      ctx.translate(planet.x, planet.y);
      ctx.rotate(planet.angleRad);
      const size = planet.radius * 2;
      ctx.drawImage(this.images.platform, -planet.radius, -planet.radius, size, size);
      ctx.restore();
    }
  }

  private drawAttachments(world: GameWorld): void {
    const ctx = this.ctx;
    for (const item of world.attachments) {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(item.angleRad);
      const img = item.kind === 'point' ? this.images.point : this.images.enemy;
      const size = item.radius * 2;
      ctx.drawImage(img, -item.radius, -item.radius, size, size);
      ctx.restore();
    }
  }

  private drawRocket(world: GameWorld): void {
    const rocket = world.rocket;
    if (rocket.opacity <= 0) {
      return;
    }
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = rocket.opacity;
    ctx.translate(rocket.x, rocket.y);
    ctx.rotate(rocket.angleRad);
    ctx.drawImage(
      this.images.player,
      -GameConfig.ROCKET_WIDTH / 2,
      -GameConfig.ROCKET_HEIGHT / 2,
      GameConfig.ROCKET_WIDTH,
      GameConfig.ROCKET_HEIGHT
    );
    ctx.restore();
  }

  private drawParticles(world: GameWorld, kind: 'star' | 'trail' | 'burst'): void {
    const ctx = this.ctx;
    const img =
      kind === 'star'
        ? this.images.effectBg
        : kind === 'trail'
          ? this.images.effectPlayer
          : this.images.particle;

    for (const p of world.particles) {
      if (p.kind !== kind || p.opacity <= 0) {
        continue;
      }
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angleRad);
      const w = img.width * p.scale;
      const h = img.height * p.scale;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
  }

  private drawScorePopups(world: GameWorld): void {
    const ctx = this.ctx;
    for (const p of world.particles) {
      if (p.kind !== 'scorePopup' || p.opacity <= 0) {
        continue;
      }
      const sy = p.frame === 1 ? 47 : 1;
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.drawImage(this.images.effectScore, 1, sy, 76, 44, p.x - 38, p.y - 22, 76, 44);
      ctx.restore();
    }
  }
}
