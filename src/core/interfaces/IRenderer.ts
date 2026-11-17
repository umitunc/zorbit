import type { GameWorld } from '../state/GameWorld';

export interface IRenderer {
  render(world: GameWorld): void;
  resize(width: number, height: number): void;
}
