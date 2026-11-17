export type SoundId =
  | 'player1'
  | 'player2'
  | 'point'
  | 'enemy'
  | 'lose'
  | 'best'
  | 'button1'
  | 'button2';

export interface IAudioPlayer {
  play(soundId: SoundId, volumeDb?: number): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
}
