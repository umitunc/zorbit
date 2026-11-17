import './style.css';
import { GameConfig } from './core/config/GameConfig';
import { GameEngine } from './core/GameEngine';
import { WebAudioPlayer } from './infrastructure/audio/WebAudioPlayer';
import { BrowserInputProvider } from './infrastructure/input/BrowserInputProvider';
import { createGameRenderer } from './infrastructure/render/RendererFactory';
import { LocalStorageScoreRepository } from './infrastructure/storage/LocalStorageScoreRepository';
import { UIManager } from './ui/UIManager';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function bootstrap(): Promise<void> {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    throw new Error('Missing #game-canvas element');
  }

  const preloaderBar = document.getElementById('preloader-bar');
  const updatePreloader = (progress: number) => {
    if (preloaderBar) {
      const pct = Math.max(12, Math.min(100, Math.round(progress * 100)));
      preloaderBar.style.width = `${pct}%`;
    }
  };

  const [renderer] = await Promise.all([
    createGameRenderer(canvas, updatePreloader),
    wait(GameConfig.INTRO_SPLASH_DURATION_MS),
  ]);
  updatePreloader(1);

  const audio = new WebAudioPlayer();
  const input = new BrowserInputProvider(canvas);
  const scoreRepository = new LocalStorageScoreRepository();

  let engine: GameEngine;
  const ui = new UIManager(audio, () => {
    engine.startNewGame();
  });

  engine = new GameEngine(
    {
      renderer,
      audio,
      input,
      scoreRepository,
    },
    {
      onPhaseChange: (phase, world) => ui.updatePhase(phase, world),
      onScoreChange: (score) => ui.updateScore(score),
    }
  );

  const handleResize = () => {
    renderer.resize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', handleResize);
  handleResize();

  await engine.init();
  engine.startLoop();
}

void bootstrap();
