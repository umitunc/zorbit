import type { IAudioPlayer } from '../core/interfaces/IAudioPlayer';
import type { GamePhase } from '../core/state/GameState';
import type { GameWorld } from '../core/state/GameWorld';

export class UIManager {
  private readonly loadingEl: HTMLElement;
  private readonly menuEl: HTMLElement;
  private readonly hudEl: HTMLElement;
  private readonly hudScoreEl: HTMLElement;
  private readonly menuScoreEl: HTMLElement;
  private readonly menuBestEl: HTMLElement;
  private readonly startBtn: HTMLButtonElement;
  private readonly soundBtn: HTMLButtonElement;
  private readonly fullscreenBtn: HTMLButtonElement;

  constructor(
    private readonly audio: IAudioPlayer,
    private readonly onStartClick: () => void
  ) {
    this.loadingEl = this.requireElement('screen-loading');
    this.menuEl = this.requireElement('screen-menu');
    this.hudEl = this.requireElement('screen-hud');
    this.hudScoreEl = this.requireElement('hud-score');
    this.menuScoreEl = this.requireElement('menu-score');
    this.menuBestEl = this.requireElement('menu-best');
    this.startBtn = this.requireElement('btn-start') as HTMLButtonElement;
    this.soundBtn = this.requireElement('btn-sound') as HTMLButtonElement;
    this.fullscreenBtn = this.requireElement('btn-fullscreen') as HTMLButtonElement;

    this.bindEvents();
    this.syncSoundButton();
  }

  public updatePhase(phase: GamePhase, world: GameWorld): void {
    this.loadingEl.classList.toggle('hidden', phase !== 'loading');
    this.menuEl.classList.toggle('hidden', phase !== 'menu');
    this.hudEl.classList.toggle('hidden', phase !== 'playing' && phase !== 'gameover');

    if (phase === 'menu') {
      this.menuScoreEl.textContent = String(world.score);
      this.menuBestEl.textContent = String(world.bestScore);
      this.menuScoreEl.classList.toggle('new-best', world.isNewBest);
    }

    if (phase === 'playing') {
      this.updateScore(world.score);
    }
  }

  public updateScore(score: number): void {
    if (score === 0) {
      this.hudScoreEl.textContent = 'Dokunun ve roketi diğer gezegene ateşleyin';
      this.hudScoreEl.classList.add('hint');
    } else {
      this.hudScoreEl.textContent = String(score);
      this.hudScoreEl.classList.remove('hint');
    }
  }

  private bindEvents(): void {
    this.startBtn.addEventListener('click', () => {
      this.onStartClick();
    });

    this.soundBtn.addEventListener('click', () => {
      const nextMuted = !this.audio.isMuted();
      this.audio.setMuted(nextMuted);
      if (!nextMuted) {
        this.audio.play('button2', -5);
      }
      this.syncSoundButton();
    });

    this.fullscreenBtn.addEventListener('click', () => {
      this.audio.play('button2', -5);
      if (!document.fullscreenElement) {
        void document.documentElement.requestFullscreen().catch(() => {});
      } else {
        void document.exitFullscreen().catch(() => {});
      }
    });
  }

  private syncSoundButton(): void {
    this.soundBtn.classList.toggle('muted', this.audio.isMuted());
  }

  private requireElement(id: string): HTMLElement {
    const el = document.getElementById(id);
    if (!el) {
      throw new Error(`Missing required UI element #${id}`);
    }
    return el;
  }
}
