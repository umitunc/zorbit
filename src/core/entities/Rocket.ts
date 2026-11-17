import type { CircleBounds } from './Vector2';
import { GameConfig } from '../config/GameConfig';

export interface RocketOptions {
  x: number;
  y: number;
  angleRad: number;
  speed: number;
  pinnedPlanetId: number | null;
  orbitAngleRad?: number;
}

export class Rocket {
  public x: number;
  public y: number;
  public angleRad: number;
  public speed: number;
  public pinnedPlanetId: number | null;
  public orbitAngleRad: number;
  public isFlying: boolean;

  constructor(options: RocketOptions) {
    this.x = options.x;
    this.y = options.y;
    this.angleRad = options.angleRad;
    this.speed = options.speed;
    this.pinnedPlanetId = options.pinnedPlanetId;
    this.orbitAngleRad = options.orbitAngleRad ?? options.angleRad;
    this.isFlying = options.pinnedPlanetId === null;
  }

  public get isPinned(): boolean {
    return this.pinnedPlanetId !== null;
  }

  public launch(): void {
    if (!this.isPinned) {
      return;
    }
    this.pinnedPlanetId = null;
    this.isFlying = true;
  }

  public pinToPlanet(planetId: number, orbitAngleRad: number): void {
    this.pinnedPlanetId = planetId;
    this.isFlying = false;
    this.orbitAngleRad = orbitAngleRad;
    this.angleRad = orbitAngleRad;
  }

  public getBounds(): CircleBounds {
    return {
      x: this.x,
      y: this.y,
      radius: GameConfig.ROCKET_COLLISION_RADIUS,
    };
  }
}
