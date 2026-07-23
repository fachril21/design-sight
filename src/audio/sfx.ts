import { Howl } from 'howler';

/**
 * SFX manager (Epic 01 stub, fleshed out by Epic 02's juice pass).
 * Missing audio files are a supported state: play() silently no-ops for
 * unloaded sounds so UI code can call it unconditionally.
 */
export type SfxName =
  | 'press'
  | 'tick'
  | 'lock'
  | 'scoreRise'
  | 'stamp'
  | 'perfect'
  | 'damage';

const MANIFEST: Record<SfxName, string> = {
  press: '/sfx/press.mp3',
  tick: '/sfx/tick.mp3',
  lock: '/sfx/lock.mp3',
  scoreRise: '/sfx/score-rise.mp3',
  stamp: '/sfx/stamp.mp3',
  perfect: '/sfx/perfect.mp3',
  damage: '/sfx/damage.mp3',
};

const MUTE_KEY = 'ds_muted';

class SfxManager {
  private sounds = new Map<SfxName, Howl>();
  private muted: boolean;
  private listeners = new Set<() => void>();

  constructor() {
    this.muted = this.readMuted();
  }

  private readMuted(): boolean {
    try {
      return localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      return false;
    }
  }

  /** Lazy-load a sound on first use; failures leave it absent (silent). */
  private get(name: SfxName): Howl | undefined {
    if (!this.sounds.has(name)) {
      try {
        const howl = new Howl({
          src: [MANIFEST[name]],
          preload: true,
          onloaderror: () => this.sounds.delete(name),
        });
        this.sounds.set(name, howl);
      } catch {
        return undefined;
      }
    }
    return this.sounds.get(name);
  }

  play(name: SfxName): void {
    if (this.muted) return;
    const sound = this.get(name);
    if (sound && sound.state() === 'loaded') sound.play();
  }

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch {
      /* private mode: mute is session-only */
    }
    this.listeners.forEach((l) => l());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const sfx = new SfxManager();
