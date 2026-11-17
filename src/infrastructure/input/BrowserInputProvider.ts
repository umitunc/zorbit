import type { IInputProvider } from '../../core/interfaces/IInputProvider';

export class BrowserInputProvider implements IInputProvider {
  private readonly listeners = new Set<() => void>();

  private readonly handlePointerDown = (event: PointerEvent) => {
    if (event.button !== 0 && event.pointerType === 'mouse') {
      return;
    }
    this.emitLaunch();
  };

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (event.code === 'Space' || event.code === 'ArrowUp') {
      event.preventDefault();
      this.emitLaunch();
    }
  };

  constructor(private readonly targetElement: HTMLElement) {
    this.targetElement.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('keydown', this.handleKeyDown);
  }

  public onLaunchIntent(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public dispose(): void {
    this.targetElement.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('keydown', this.handleKeyDown);
    this.listeners.clear();
  }

  private emitLaunch(): void {
    for (const cb of this.listeners) {
      cb();
    }
  }
}
