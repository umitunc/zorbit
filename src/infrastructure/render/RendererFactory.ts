import type { IRenderer } from '../../core/interfaces/IRenderer';
import { AssetLoader } from './AssetLoader';
import { loadCoreTextures } from './AssetManifest';
import { CanvasRenderer } from './CanvasRenderer';
import { PixiRenderer } from './PixiRenderer';

export async function createGameRenderer(
  canvas: HTMLCanvasElement,
  onProgress?: (progress: number) => void
): Promise<IRenderer> {
  try {
    const textures = await loadCoreTextures(onProgress);
    return await PixiRenderer.create(canvas, textures);
  } catch (err) {
    console.warn('WebGL renderer initialization failed, falling back to Canvas 2D:', err);
    const assetLoader = new AssetLoader();
    const images = await assetLoader.loadImages();
    onProgress?.(1);
    return new CanvasRenderer(canvas, images);
  }
}

