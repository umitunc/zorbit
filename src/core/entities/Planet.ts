import type { CircleBounds } from './Vector2';
import { GameConfig } from '../config/GameConfig';

export interface PlanetOptions {
  id: number;
  x: number;
  y: number;
  radius: number;
  rotationSpeedRad: number;
  angleRad?: number;
  active?: boolean;
}

export class Planet {
  public readonly id: number;
  public x: number;
  public y: number;
  public radius: number;
  public angleRad: number;
  public rotationSpeedRad: number;
  public active: boolean;
  public opacity: number = 1;
  public isFadingOut: boolean = false;
  public fadeDurationSec: number = GameConfig.PLANET_FADE_DURATION_SEC;

  constructor(options: PlanetOptions) {
    this.id = options.id;
    this.x = options.x;
    this.y = options.y;
    this.radius = options.radius;
    this.rotationSpeedRad = options.rotationSpeedRad;
    this.angleRad = options.angleRad ?? 0;
    this.active = options.active ?? false;
  }

  public startFadeOut(durationSec: number = GameConfig.PLANET_FADE_DURATION_SEC): void {
    this.isFadingOut = true;
    this.fadeDurationSec = durationSec;
  }

  public updateFade(dt: number): void {
    if (!this.isFadingOut || this.fadeDurationSec <= 0) {
      return;
    }
    this.opacity = Math.max(0, this.opacity - dt / this.fadeDurationSec);
  }

  public getBounds(): CircleBounds {
    return {
      x: this.x,
      y: this.y,
      radius: this.radius,
    };
  }
}
