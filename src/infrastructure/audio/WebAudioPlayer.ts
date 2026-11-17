import type { IAudioPlayer, SoundId } from '../../core/interfaces/IAudioPlayer';

const MUTE_STORAGE_KEY = 'zorbit_muted';

export class WebAudioPlayer implements IAudioPlayer {
  private muted: boolean;
  private readonly cache = new Map<SoundId, HTMLAudioElement>();

  constructor() {
    this.muted = localStorage.getItem(MUTE_STORAGE_KEY) === '1';
  }

  public play(soundId: SoundId, volumeDb: number = 0): void {
    if (this.muted) {
      return;
    }

    let template = this.cache.get(soundId);
    if (!template) {
      template = new Audio(`/assets/media/${soundId}.ogg`);
      this.cache.set(soundId, template);
    }

    const instance = template.cloneNode(true) as HTMLAudioElement;
    const linearGain = Math.min(1, Math.max(0, Math.pow(10, volumeDb / 20)));
    instance.volume = linearGain;
    void instance.play().catch(() => {
      // Ignore autoplay restrictions before first user gesture
    });
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    localStorage.setItem(MUTE_STORAGE_KEY, muted ? '1' : '0');
  }

  public isMuted(): boolean {
    return this.muted;
  }
}
