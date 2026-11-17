export interface GameImages {
  platform: HTMLImageElement;
  player: HTMLImageElement;
  point: HTMLImageElement;
  enemy: HTMLImageElement;
  effectBg: HTMLImageElement;
  effectPlayer: HTMLImageElement;
  effectScore: HTMLImageElement;
  particle: HTMLImageElement;
}

const IMAGE_PATHS: Record<keyof GameImages, string> = {
  platform: '/assets/images/platform-sheet0.png',
  player: '/assets/images/player-sheet0.png',
  point: '/assets/images/point-sheet0.png',
  enemy: '/assets/images/enemy-sheet0.png',
  effectBg: '/assets/images/effectbg-sheet0.png',
  effectPlayer: '/assets/images/effectplayer-sheet0.png',
  effectScore: '/assets/images/effectscore-sheet0.png',
  particle: '/assets/images/particles1.png',
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

export class AssetLoader {
  public async loadImages(): Promise<GameImages> {
    const entries = await Promise.all(
      (Object.entries(IMAGE_PATHS) as Array<[keyof GameImages, string]>).map(
        async ([key, path]) => [key, await loadImage(path)] as const
      )
    );
    return Object.fromEntries(entries) as unknown as GameImages;
  }
}
