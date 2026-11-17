export interface IRandomProvider {
  range(min: number, max: number): number;
  choose<T>(items: readonly T[]): T;
}

export class DefaultRandomProvider implements IRandomProvider {
  range(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  choose<T>(items: readonly T[]): T {
    const index = Math.floor(Math.random() * items.length);
    return items[index];
  }
}
