import { GameConfig } from '../config/GameConfig';
import { degToRad } from './Vector2';
import { PlanetAttachment, type AttachmentEffect, type AttachmentKind } from './PlanetAttachment';

export class EnemyItem extends PlanetAttachment {
  constructor(id: number, planetId: number, localAngleOffsetRad: number, orbitDistance: number) {
    super(
      id,
      planetId,
      localAngleOffsetRad,
      orbitDistance,
      GameConfig.ENEMY_RADIUS,
      degToRad(GameConfig.ENEMY_SPIN_SPEED_DEG)
    );
  }

  public get kind(): AttachmentKind {
    return 'enemy';
  }

  public onCollect(): AttachmentEffect {
    this.collected = true;
    return {
      scoreDelta: -GameConfig.ENEMY_SCORE_PENALTY,
      soundId: 'enemy',
      popupFrame: 1,
    };
  }
}
