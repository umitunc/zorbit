import { GameConfig } from '../config/GameConfig';
import { Planet } from '../entities/Planet';
import type { PlanetAttachment } from '../entities/PlanetAttachment';
import { Rocket } from '../entities/Rocket';
import { degToRad } from '../entities/Vector2';
import type { Particle } from '../entities/Particle';
import type { CameraState, GamePhase } from './GameState';

export class GameWorld {
  public phase: GamePhase = 'loading';
  public score: number = 0;
  public bestScore: number = 0;
  public isNewBest: boolean = false;
  public difficultyDeg: number = GameConfig.INITIAL_DIFFICULTY_DEG;
  public flightTimerSec: number = 0;
  public nextEntityId: number = 1;

  public planets: Planet[] = [];
  public attachments: PlanetAttachment[] = [];
  public particles: Particle[] = [];
  public rocket: Rocket;
  public camera: CameraState;

  constructor() {
    this.rocket = this.createInitialRocket();
    this.camera = {
      x: this.rocket.x,
      y: this.rocket.y + GameConfig.CAMERA_Y_OFFSET,
      zoom: 1.0,
      shakeIntensity: 0,
    };
  }

  public resetForNewRun(): void {
    this.score = 0;
    this.isNewBest = false;
    this.difficultyDeg = GameConfig.INITIAL_DIFFICULTY_DEG;
    this.flightTimerSec = 0;
    this.nextEntityId = 1;
    this.planets = [];
    this.attachments = [];
    this.particles = [];

    const startPlanet = new Planet({
      id: this.allocateId(),
      x: GameConfig.INITIAL_PLANET_X,
      y: GameConfig.INITIAL_PLANET_Y,
      radius: GameConfig.INITIAL_PLANET_RADIUS,
      rotationSpeedRad: 0,
      active: true,
    });

    const secondPlanet = new Planet({
      id: this.allocateId(),
      x: GameConfig.SECOND_PLANET_X,
      y: GameConfig.SECOND_PLANET_Y,
      radius: GameConfig.SECOND_PLANET_RADIUS,
      rotationSpeedRad: degToRad(GameConfig.SECOND_PLANET_ROTATION_SPEED_DEG),
      active: false,
    });

    this.planets.push(startPlanet, secondPlanet);

    this.rocket = this.createInitialRocket(startPlanet.id);
    this.camera = {
      x: this.rocket.x,
      y: this.rocket.y + GameConfig.CAMERA_Y_OFFSET,
      zoom: 1.0,
      shakeIntensity: 0,
    };
  }

  public allocateId(): number {
    return this.nextEntityId++;
  }

  public getPlanetById(id: number | null): Planet | undefined {
    if (id === null) {
      return undefined;
    }
    return this.planets.find((planet) => planet.id === id);
  }

  private createInitialRocket(pinnedPlanetId: number | null = 1): Rocket {
    const orbitAngle = -Math.PI / 2;
    const distance = GameConfig.INITIAL_PLANET_RADIUS + GameConfig.ROCKET_ORBIT_OFFSET;
    return new Rocket({
      x: GameConfig.INITIAL_PLANET_X + Math.cos(orbitAngle) * distance,
      y: GameConfig.INITIAL_PLANET_Y + Math.sin(orbitAngle) * distance,
      angleRad: orbitAngle,
      speed: GameConfig.ROCKET_INITIAL_SPEED,
      pinnedPlanetId,
      orbitAngleRad: orbitAngle,
    });
  }
}
