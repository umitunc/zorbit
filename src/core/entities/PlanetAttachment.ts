import type { CircleBounds } from './Vector2';
import type { SoundId } from '../interfaces/IAudioPlayer';

export type AttachmentKind = 'point' | 'enemy';

export interface AttachmentEffect {
  scoreDelta: number;
  soundId: SoundId;
  popupFrame: 0 | 1; // 0 = +3, 1 = -3
}

export abstract class PlanetAttachment {
  public readonly id: number;
  public readonly planetId: number;
  public readonly localAngleOffsetRad: number;
  public readonly orbitDistance: number;
  public readonly radius: number;
  public x: number = 0;
  public y: number = 0;
  public angleRad: number = 0;
  public spinSpeedRad: number = 0;
  public collected: boolean = false;

  protected constructor(
    id: number,
    planetId: number,
    localAngleOffsetRad: number,
    orbitDistance: number,
    radius: number,
    spinSpeedRad: number = 0
  ) {
    this.id = id;
    this.planetId = planetId;
    this.localAngleOffsetRad = localAngleOffsetRad;
    this.orbitDistance = orbitDistance;
    this.radius = radius;
    this.spinSpeedRad = spinSpeedRad;
  }

  public abstract get kind(): AttachmentKind;

  public abstract onCollect(): AttachmentEffect;

  public getBounds(): CircleBounds {
    return {
      x: this.x,
      y: this.y,
      radius: this.radius,
    };
  }
}
