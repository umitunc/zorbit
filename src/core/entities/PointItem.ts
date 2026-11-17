import { GameConfig } from '../config/GameConfig';
import { PlanetAttachment, type AttachmentEffect, type AttachmentKind } from './PlanetAttachment';

export class PointItem extends PlanetAttachment {
  constructor(id: number, planetId: number, localAngleOffsetRad: number, orbitDistance: number) {
    super(id, planetId, localAngleOffsetRad, orbitDistance, GameConfig.POINT_RADIUS, 0);
  }

  public get kind(): AttachmentKind {
    return 'point';
  }

  public onCollect(): AttachmentEffect {
    this.collected = true;
    return {
      scoreDelta: GameConfig.POINT_SCORE_BONUS,
      soundId: 'point',
      popupFrame: 0,
    };
  }
}
