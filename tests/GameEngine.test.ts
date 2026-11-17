import { describe, expect, it, vi } from 'vitest';
import { GameEngine } from '../src/core/GameEngine';
import type { IAudioPlayer } from '../src/core/interfaces/IAudioPlayer';
import type { IInputProvider } from '../src/core/interfaces/IInputProvider';
import type { IRenderer } from '../src/core/interfaces/IRenderer';
import type { IScoreRepository } from '../src/core/interfaces/IScoreRepository';

function createMocks() {
  let launchCb: (() => void) | null = null;
  const renderer: IRenderer = { render: vi.fn(), resize: vi.fn() };
  const audio: IAudioPlayer = {
    play: vi.fn(),
    setMuted: vi.fn(),
    isMuted: () => false,
  };
  const input: IInputProvider = {
    onLaunchIntent: (cb) => {
      launchCb = cb;
      return () => {
        launchCb = null;
      };
    },
    dispose: vi.fn(),
  };
  const scoreRepository: IScoreRepository = {
    getBestScore: vi.fn(async () => 2),
    saveBestScore: vi.fn(async () => {}),
  };

  return {
    renderer,
    audio,
    input,
    scoreRepository,
    triggerLaunch: () => launchCb?.(),
  };
}

describe('GameEngine', () => {
  it('launches rocket, lands on target planet, scores, and triggers timeout gameover on miss', async () => {
    const mocks = createMocks();
    const engine = new GameEngine(mocks);
    await engine.init();

    expect(engine.world.phase).toBe('menu');
    expect(engine.world.bestScore).toBe(2);

    engine.startNewGame();
    expect(engine.world.phase).toBe('playing');

    // First shot goes straight up to second planet
    mocks.triggerLaunch();
    expect(engine.world.rocket.isFlying).toBe(true);
    expect(mocks.audio.play).toHaveBeenCalledWith('player1');

    // Step until rocket hits second planet (~0.4s at 1600 px/s over ~610px)
    for (let i = 0; i < 30; i++) {
      engine.step(0.02);
      if (engine.world.score === 1) break;
    }
    expect(engine.world.score).toBe(1);
    expect(engine.world.rocket.isPinned).toBe(true);

    // Aim away from next planet by launching immediately into empty space
    engine.world.planets = [engine.world.planets[1]]; // remove target so it misses
    mocks.triggerLaunch();
    for (let i = 0; i < 16; i++) {
      engine.step(0.02);
    }
    expect(engine.world.phase).toBe('gameover');
    expect(mocks.audio.play).toHaveBeenCalledWith('lose');
    expect(engine.world.rocket.isFadingOut).toBe(true);
    expect(engine.world.rocket.opacity).toBeLessThan(1);
    expect(engine.world.rocket.opacity).toBeGreaterThan(0);

    for (let i = 0; i < 25; i++) {
      engine.step(0.02);
    }
    expect(engine.world.rocket.opacity).toBe(0);
    expect(engine.world.phase).toBe('menu');

    // Also verify tap/space during gameover immediately returns to menu
    engine.startNewGame();
    engine.world.planets = [engine.world.planets[0]];
    mocks.triggerLaunch();
    for (let i = 0; i < 16; i++) {
      engine.step(0.02);
    }
    expect(engine.world.phase).toBe('gameover');
    mocks.triggerLaunch();
    expect(engine.world.phase).toBe('menu');
  });
});
