import { Application, Container, Sprite, type Texture } from 'pixi.js';
import { GameConfig } from '../../core/config/GameConfig';
import type { IRenderer } from '../../core/interfaces/IRenderer';
import type { GameWorld } from '../../core/state/GameWorld';
import type { CoreTextures } from './AssetManifest';

class SpriteLayerPool {
  public readonly container = new Container();
  private readonly pool: Sprite[] = [];
  private activeCount = 0;

  public beginFrame(): void {
    this.activeCount = 0;
  }

  public acquire(texture: Texture): Sprite {
    let sprite = this.pool[this.activeCount];
    if (!sprite) {
      sprite = new Sprite(texture);
      sprite.anchor.set(0.5);
      this.pool.push(sprite);
      this.container.addChild(sprite);
    } else if (sprite.texture !== texture) {
      sprite.texture = texture;
    }

    sprite.visible = true;
    this.activeCount++;
    return sprite;
  }

  public endFrame(): void {
    for (let i = this.activeCount; i < this.pool.length; i++) {
      this.pool[i].visible = false;
    }
  }
}

export class PixiRenderer implements IRenderer {
  private readonly worldContainer = new Container();
  private readonly starLayer = new SpriteLayerPool();
  private readonly trailLayer = new SpriteLayerPool();
  private readonly planetLayer = new SpriteLayerPool();
  private readonly attachmentLayer = new SpriteLayerPool();
  private readonly burstLayer = new SpriteLayerPool();
  private readonly scorePopupLayer = new SpriteLayerPool();
  private readonly rocketSprite: Sprite;

  private viewportWidth: number = GameConfig.VIRTUAL_WIDTH;
  private viewportHeight: number = GameConfig.VIRTUAL_HEIGHT;

  private constructor(
    private readonly app: Application,
    private readonly textures: CoreTextures
  ) {
    this.rocketSprite = new Sprite(textures.player);
    this.rocketSprite.anchor.set(0.5);
    this.rocketSprite.width = GameConfig.ROCKET_WIDTH;
    this.rocketSprite.height = GameConfig.ROCKET_HEIGHT;

    this.worldContainer.addChild(
      this.starLayer.container,
      this.trailLayer.container,
      this.planetLayer.container,
      this.attachmentLayer.container,
      this.rocketSprite,
      this.burstLayer.container,
      this.scorePopupLayer.container
    );

    this.app.stage.addChild(this.worldContainer);
  }

  public static async create(
    canvas: HTMLCanvasElement,
    textures: CoreTextures
  ): Promise<PixiRenderer> {
    const app = new Application();
    await app.init({
      canvas,
      preference: 'webgl',
      backgroundColor: 0x070913,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoStart: false,
    });
    return new PixiRenderer(app, textures);
  }

  public resize(width: number, height: number): void {
    this.viewportWidth = Math.max(1, width);
    this.viewportHeight = Math.max(1, height);
    this.app.renderer.resize(this.viewportWidth, this.viewportHeight);
  }

  public render(world: GameWorld): void {
    if (world.phase === 'loading' || world.phase === 'menu') {
      this.worldContainer.visible = false;
      this.app.renderer.render(this.app.stage);
      return;
    }

    this.worldContainer.visible = true;

    const scaleX = this.viewportWidth / GameConfig.VIRTUAL_WIDTH;
    const scaleY = this.viewportHeight / GameConfig.VIRTUAL_HEIGHT;
    const fitScale = Math.min(scaleX, scaleY * 1.25);
    const totalScale = fitScale * world.camera.zoom;

    const shakeX =
      world.camera.shakeIntensity > 0
        ? (Math.random() - 0.5) * world.camera.shakeIntensity
        : 0;
    const shakeY =
      world.camera.shakeIntensity > 0
        ? (Math.random() - 0.5) * world.camera.shakeIntensity
        : 0;

    this.worldContainer.position.set(
      this.viewportWidth / 2 + shakeX,
      this.viewportHeight / 2 + shakeY
    );
    this.worldContainer.scale.set(totalScale);
    this.worldContainer.pivot.set(world.camera.x, world.camera.y);

    this.syncPlanets(world);
    this.syncAttachments(world);
    this.syncRocket(world);
    this.syncParticles(world);

    this.app.renderer.render(this.app.stage);
  }

  private syncPlanets(world: GameWorld): void {
    this.planetLayer.beginFrame();
    for (const planet of world.planets) {
      if (planet.opacity <= 0) {
        continue;
      }
      const sprite = this.planetLayer.acquire(this.textures.platform);
      const size = planet.radius * 2;
      sprite.position.set(planet.x, planet.y);
      sprite.rotation = planet.angleRad;
      sprite.width = size;
      sprite.height = size;
      sprite.alpha = planet.opacity;
    }
    this.planetLayer.endFrame();
  }

  private syncAttachments(world: GameWorld): void {
    this.attachmentLayer.beginFrame();
    for (const item of world.attachments) {
      const texture = item.kind === 'point' ? this.textures.point : this.textures.enemy;
      const sprite = this.attachmentLayer.acquire(texture);
      const size = item.radius * 2;
      sprite.position.set(item.x, item.y);
      sprite.rotation = item.angleRad;
      sprite.width = size;
      sprite.height = size;
      sprite.alpha = 1;
    }
    this.attachmentLayer.endFrame();
  }

  private syncRocket(world: GameWorld): void {
    const rocket = world.rocket;
    if (rocket.opacity <= 0) {
      this.rocketSprite.visible = false;
      return;
    }
    this.rocketSprite.visible = true;
    this.rocketSprite.position.set(rocket.x, rocket.y);
    this.rocketSprite.rotation = rocket.angleRad;
    this.rocketSprite.alpha = rocket.opacity;
  }

  private syncParticles(world: GameWorld): void {
    this.starLayer.beginFrame();
    this.trailLayer.beginFrame();
    this.burstLayer.beginFrame();
    this.scorePopupLayer.beginFrame();

    for (const p of world.particles) {
      if (p.opacity <= 0) {
        continue;
      }

      if (p.kind === 'scorePopup') {
        const tex = p.frame === 1 ? this.textures.scoreMinus3 : this.textures.scorePlus3;
        const sprite = this.scorePopupLayer.acquire(tex);
        sprite.position.set(p.x, p.y);
        sprite.rotation = 0;
        sprite.scale.set(1);
        sprite.alpha = p.opacity;
        continue;
      }

      const layer =
        p.kind === 'star'
          ? this.starLayer
          : p.kind === 'trail'
            ? this.trailLayer
            : this.burstLayer;
      const tex =
        p.kind === 'star'
          ? this.textures.effectBg
          : p.kind === 'trail'
            ? this.textures.effectPlayer
            : this.textures.particle;

      const sprite = layer.acquire(tex);
      sprite.position.set(p.x, p.y);
      sprite.rotation = p.angleRad;
      sprite.scale.set(p.scale);
      sprite.alpha = p.opacity;
    }

    this.starLayer.endFrame();
    this.trailLayer.endFrame();
    this.burstLayer.endFrame();
    this.scorePopupLayer.endFrame();
  }
}

