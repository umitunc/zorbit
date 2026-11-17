export interface IInputProvider {
  onLaunchIntent(callback: () => void): () => void;
  dispose(): void;
}
