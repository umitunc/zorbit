import { Assets, Rectangle, Texture, type AssetsManifest } from 'pixi.js';

export interface CoreTextures {
  platform: Texture;
  player: Texture;
  point: Texture;
  enemy: Texture;
  effectBg: Texture;
  effectPlayer: Texture;
  scorePlus3: Texture;
  scoreMinus3: Texture;
  particle: Texture;
}

export const ASSET_MANIFEST: AssetsManifest = {
  bundles: [
    {
      name: 'core',
      assets: [
        { alias: 'platform', src: '/assets/images/platform-sheet0.png' },
        { alias: 'player', src: '/assets/images/player-sheet0.png' },
        { alias: 'point', src: '/assets/images/point-sheet0.png' },
        { alias: 'enemy', src: '/assets/images/enemy-sheet0.png' },
        { alias: 'effectBg', src: '/assets/images/effectbg-sheet0.png' },
        { alias: 'effectPlayer', src: '/assets/images/effectplayer-sheet0.png' },
        { alias: 'effectScore', src: '/assets/images/effectscore-sheet0.png' },
        { alias: 'particle', src: '/assets/images/particles1.png' },
      ],
    },
  ],
};

let manifestInitialized = false;

export async function loadCoreTextures(
  onProgress?: (progress: number) => void
): Promise<CoreTextures> {
  if (!manifestInitialized) {
    await Assets.init({ manifest: ASSET_MANIFEST });
    manifestInitialized = true;
  }

  const bundle = (await Assets.loadBundle('core', onProgress)) as Record<string, Texture>;
  const effectScore = bundle.effectScore;

  const scorePlus3 = new Texture({
    source: effectScore.source,
    frame: new Rectangle(1, 1, 76, 44),
  });
  const scoreMinus3 = new Texture({
    source: effectScore.source,
    frame: new Rectangle(1, 47, 76, 44),
  });

  return {
    platform: bundle.platform,
    player: bundle.player,
    point: bundle.point,
    enemy: bundle.enemy,
    effectBg: bundle.effectBg,
    effectPlayer: bundle.effectPlayer,
    scorePlus3,
    scoreMinus3,
    particle: bundle.particle,
  };
}

