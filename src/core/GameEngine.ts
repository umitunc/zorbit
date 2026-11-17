import { GameConfig } from './config/GameConfig';
import { angleBetween } from './entities/Vector2';
import type { IAudioPlayer } from './interfaces/IAudioPlayer';
import type { IInputProvider } from './interfaces/IInputProvider';
import { DefaultRandomProvider, type IRandomProvider } from './interfaces/IRandomProvider';
import type { IRenderer } from './interfaces/IRenderer';
import type { IScoreRepository } from './interfaces/IScoreRepository';
import type { GamePhase } from './state/GameState';
import { GameWorld } from './state/GameWorld';
import { CameraSystem } from './systems/CameraSystem';
import { CollisionSystem } from './systems/CollisionSystem';
import { DifficultySystem } from './systems/DifficultySystem';
import { FlightSystem } from './systems/FlightSystem';
import { OrbitSystem } from './systems/OrbitSystem';
import { ParticleSystem } from './systems/ParticleSystem';
import { SpawnSystem } from './systems/SpawnSystem';

export interface GameEngineDependencies {
  renderer: IRenderer;
  audio: IAudioPlayer;
  input: IInputProvider;
  scoreRepository: IScoreRepository;
  random?: IRandomProvider;
}

export interface GameEngineCallbacks {
  onPhaseChange?: (phase: GamePhase, world: GameWorld) => void;
  onScoreChange?: (score: number, bestScore: number) => void;
}

export class GameEngine {
  public readonly world: GameWorld;

  private readonly orbitSystem = new OrbitSystem();
  private readonly flightSystem = new FlightSystem();
  private readonly collisionSystem = new CollisionSystem();
  private readonly difficultySystem = new DifficultySystem();
  private readonly cameraSystem = new CameraSystem();
  private readonly spawnSystem: SpawnSystem;
  private readonly particleSystem: ParticleSystem;

  private rafId: number | null = null;
  private lastTimestampMs: number = 0;
  private unsubscribeInput: (() => void) | null = null;
  private gameOverDelaySec: number = 0;

  constructor(
    private readonly deps: GameEngineDependencies,
    private readonly callbacks: GameEngineCallbacks = {}
  ) {
    const random = deps.random ?? new DefaultRandomProvider();
    this.spawnSystem = new SpawnSystem(random);
    this.particleSystem = new ParticleSystem(random);
    this.world = new GameWorld();
  }

  public async init(): Promise<void> {
    this.world.bestScore = await this.deps.scoreRepository.getBestScore();
    this.unsubscribeInput = this.deps.input.onLaunchIntent(() => {
      this.handleLaunchIntent();
    });
    this.setPhase('menu');
  }

  public startLoop(): void {
    if (this.rafId !== null) {
      return;
    }
    this.lastTimestampMs = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - this.lastTimestampMs) / 1000));
      this.lastTimestampMs = now;
      this.step(dt);
      this.deps.renderer.render(this.world);
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  public stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public startNewGame(): void {
    this.deps.audio.play('button1');
    this.world.resetForNewRun();
    this.particleSystem.reset();
    this.gameOverDelaySec = 0;
    this.setPhase('playing');
    this.callbacks.onScoreChange?.(this.world.score, this.world.bestScore);
  }

  public handleLaunchIntent(): void {
    if (this.world.phase !== 'playing') {
      return;
    }
    if (!this.world.rocket.isPinned) {
      return;
    }

    const hostPlanet = this.world.getPlanetById(this.world.rocket.pinnedPlanetId);
    if (hostPlanet) {
      hostPlanet.active = false;
    }

    this.deps.audio.play('player1');
    this.particleSystem.spawnBurst(this.world, this.world.rocket.x, this.world.rocket.y, 12);
    this.world.rocket.launch();
    this.world.flightTimerSec = 0;
  }

  public step(dt: number): void {
    if (this.world.phase === 'gameover') {
      this.world.rocket.updateFade(dt);
      this.particleSystem.update(this.world, dt);
      this.cameraSystem.update(this.world, dt);
      this.gameOverDelaySec -= dt;
      if (this.gameOverDelaySec <= 0) {
        this.setPhase('menu');
      }
      return;
    }

    if (this.world.phase !== 'playing') {
      return;
    }

    const orbitResult = this.orbitSystem.update(this.world, dt);
    if (orbitResult.pinnedPlanetExpired) {
      this.particleSystem.spawnBurst(this.world, this.world.rocket.x, this.world.rocket.y, 12);
      this.world.rocket.launch();
      this.triggerGameOver();
      return;
    }

    const flightResult = this.flightSystem.update(this.world, dt);
    if (flightResult.timedOut) {
      this.triggerGameOver();
      return;
    }

    const collision = this.collisionSystem.check(this.world);
    for (const hit of collision.attachmentHits) {
      this.deps.audio.play(hit.effect.soundId);
      this.world.score = Math.max(0, this.world.score + hit.effect.scoreDelta);
      this.particleSystem.spawnBurst(this.world, hit.x, hit.y, 10);
      this.particleSystem.spawnScorePopup(this.world, hit.x, hit.y, hit.effect.popupFrame);
      this.callbacks.onScoreChange?.(this.world.score, this.world.bestScore);
    }

    if (collision.landedPlanet) {
      this.handlePlanetLanding(collision.landedPlanet);
    }

    this.spawnSystem.cleanupPassedPlanets(this.world);
    this.particleSystem.update(this.world, dt);
    this.cameraSystem.update(this.world, dt);
  }

  public dispose(): void {
    this.stopLoop();
    this.unsubscribeInput?.();
    this.deps.input.dispose();
  }

  private handlePlanetLanding(planet: NonNullable<ReturnType<CollisionSystem['check']>['landedPlanet']>): void {
    this.deps.audio.play('player2');

    const outwardAngle = angleBetween(planet, this.world.rocket);
    this.world.rocket.pinToPlanet(planet.id, outwardAngle);
    const orbitDistance = planet.radius + GameConfig.ROCKET_ORBIT_OFFSET;
    this.world.rocket.x = planet.x + Math.cos(outwardAngle) * orbitDistance;
    this.world.rocket.y = planet.y + Math.sin(outwardAngle) * orbitDistance;

    planet.active = true;
    this.world.flightTimerSec = 0;

    this.particleSystem.spawnBurst(this.world, this.world.rocket.x, this.world.rocket.y, 14);
    this.difficultySystem.onPlanetLanded(this.world, planet);
    this.spawnSystem.spawnNextPlanet(this.world);

    this.callbacks.onScoreChange?.(this.world.score, this.world.bestScore);
  }

  private triggerGameOver(): void {
    this.deps.audio.play('lose');
    this.world.camera.shakeIntensity = 24;
    this.particleSystem.spawnBurst(this.world, this.world.rocket.x, this.world.rocket.y, 20);
    this.world.rocket.startFadeOut(GameConfig.ROCKET_FADE_DURATION_SEC);
    this.gameOverDelaySec = GameConfig.ROCKET_FADE_DURATION_SEC;

    if (this.world.score > this.world.bestScore) {
      this.world.bestScore = this.world.score;
      this.world.isNewBest = true;
      this.deps.audio.play('best');
      void this.deps.scoreRepository.saveBestScore(this.world.bestScore);
    }

    this.setPhase('gameover');
  }

  private setPhase(phase: GamePhase): void {
    this.world.phase = phase;
    this.callbacks.onPhaseChange?.(phase, this.world);
  }
}
