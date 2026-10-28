/**
 * A tiny Web Audio synthesis layer. No files, no network, no dependencies.
 *
 * The play screen talks to `AudioEngine` in domain terms ("a slide that travels
 * four cells", "a bump") and never touches Web Audio itself. The context is
 * created on the first gesture by the app shell; calls before that are no-ops.
 */

export type SoundCue = 'slide' | 'bump' | 'heart' | 'tick' | 'win';

export interface SoundOptions {
  /** Slide travel in cells; longer slides get a slightly longer whoosh. */
  readonly steps?: number;
}

export interface AudioEngine {
  /** Must be called from a user gesture before any sound can play. */
  unlock(): void;
  play(cue: SoundCue, options?: SoundOptions): void;
  setEnabled(enabled: boolean): void;
  dispose(): void;
}

/** Small per-cue guard so one action cannot stack duplicate sounds. */
export class SoundGate {
  private readonly playedAt = new Map<SoundCue, number>();

  private static readonly GAP_MS: Readonly<Record<SoundCue, number>> = {
    slide: 90,
    bump: 90,
    heart: 140,
    tick: 55,
    win: 1200,
  };

  shouldPlay(cue: SoundCue, now: number): boolean {
    const last = this.playedAt.get(cue);
    const gap = SoundGate.GAP_MS[cue];
    if (last !== undefined && now - last < gap) return false;
    this.playedAt.set(cue, now);
    return true;
  }

  reset(): void {
    this.playedAt.clear();
  }
}

export function slideDurationSeconds(steps: number): number {
  return 0.18 + Math.min(Math.max(steps, 1), 8) * 0.024;
}

type BrowserAudio = typeof AudioContext;

function audioContextClass(): BrowserAudio | null {
  if (typeof window === 'undefined') return null;
  const scoped = window as unknown as {
    AudioContext?: BrowserAudio;
    webkitAudioContext?: BrowserAudio;
  };
  return scoped.AudioContext ?? scoped.webkitAudioContext ?? null;
}

export function createAudioEngine(isEnabled: () => boolean): AudioEngine {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  let enabled = isEnabled();
  const gate = new SoundGate();

  function ensureContext(): AudioContext | null {
    if (context) return context;
    const Ctor = audioContextClass();
    if (!Ctor) return null;
    try {
      context = new Ctor();
      master = context.createGain();
      master.gain.value = enabled ? 0.5 : 0;
      master.connect(context.destination);
    } catch {
      context = null;
      master = null;
      return null;
    }
    return context;
  }

  function running(): { context: AudioContext; master: GainNode } | null {
    if (!enabled || !isEnabled()) return null;
    if (!context || !master || context.state === 'closed') return null;
    if (context.state === 'suspended') {
      void context.resume().catch(() => undefined);
    }
    return { context, master };
  }

  function noiseBuffer(ctx: AudioContext): AudioBuffer {
    if (noise) return noise;
    const length = Math.floor(ctx.sampleRate * 0.5);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let value = 0;
    for (let index = 0; index < length; index += 1) {
      value = value * 0.55 + (Math.random() * 2 - 1) * 0.45;
      data[index] = value;
    }
    noise = buffer;
    return buffer;
  }

  function tone(
    ctx: AudioContext,
    destination: AudioNode,
    options: {
      readonly type: OscillatorType;
      readonly from: number;
      readonly to: number;
      readonly start: number;
      readonly duration: number;
      readonly gain: number;
    },
  ): void {
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    oscillator.type = options.type;
    oscillator.frequency.setValueAtTime(options.from, options.start);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(options.to, 1),
      options.start + options.duration,
    );
    envelope.gain.setValueAtTime(0.0001, options.start);
    envelope.gain.exponentialRampToValueAtTime(
      Math.max(options.gain, 0.0002),
      options.start + Math.min(0.02, options.duration * 0.18),
    );
    envelope.gain.exponentialRampToValueAtTime(
      0.0001,
      options.start + options.duration,
    );
    oscillator.connect(envelope);
    envelope.connect(destination);
    oscillator.start(options.start);
    oscillator.stop(options.start + options.duration + 0.02);
    oscillator.addEventListener('ended', () => {
      oscillator.disconnect();
      envelope.disconnect();
    });
  }

  function whoosh(ctx: AudioContext, destination: AudioNode, steps: number): void {
    const start = ctx.currentTime + 0.005;
    const duration = slideDurationSeconds(steps);
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 0.8;
    filter.frequency.setValueAtTime(560, start);
    filter.frequency.exponentialRampToValueAtTime(1900, start + duration * 0.55);
    filter.frequency.exponentialRampToValueAtTime(420, start + duration);
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(0.09, start + 0.035);
    envelope.gain.exponentialRampToValueAtTime(0.035, start + duration * 0.6);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(destination);
    source.start(start);
    source.stop(start + duration + 0.03);
    source.addEventListener('ended', () => {
      source.disconnect();
      filter.disconnect();
      envelope.disconnect();
    });
  }

  return {
    unlock(): void {
      if (!isEnabled()) return;
      const ctx = ensureContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        void ctx.resume().catch(() => undefined);
      }
    },

    play(cue, options = {}): void {
      const output = running();
      if (!output) return;
      if (!gate.shouldPlay(cue, Date.now())) return;
      const { context: ctx, master: destination } = output;
      const now = ctx.currentTime + 0.01;
      try {
        if (cue === 'slide') {
          whoosh(ctx, destination, options.steps ?? 1);
          return;
        }
        if (cue === 'bump') {
          tone(ctx, destination, {
            type: 'sine',
            from: 145,
            to: 46,
            start: now,
            duration: 0.2,
            gain: 0.22,
          });
          tone(ctx, destination, {
            type: 'triangle',
            from: 92,
            to: 40,
            start: now,
            duration: 0.26,
            gain: 0.075,
          });
          return;
        }
        if (cue === 'heart') {
          tone(ctx, destination, {
            type: 'triangle',
            from: 523.25,
            to: 392,
            start: now + 0.075,
            duration: 0.16,
            gain: 0.09,
          });
          tone(ctx, destination, {
            type: 'triangle',
            from: 392,
            to: 293.66,
            start: now + 0.2,
            duration: 0.22,
            gain: 0.075,
          });
          return;
        }
        if (cue === 'tick') {
          tone(ctx, destination, {
            type: 'sine',
            from: 1280,
            to: 960,
            start: now,
            duration: 0.055,
            gain: 0.032,
          });
          return;
        }
        const notes = [523.25, 659.25, 783.99, 987.77, 1174.66];
        notes.forEach((frequency, index) => {
          tone(ctx, destination, {
            type: 'triangle',
            from: frequency,
            to: frequency,
            start: now + index * 0.085,
            duration: 0.48,
            gain: 0.06,
          });
          tone(ctx, destination, {
            type: 'sine',
            from: frequency * 2,
            to: frequency * 2,
            start: now + index * 0.085,
            duration: 0.3,
            gain: 0.018,
          });
        });
      } catch {
        // Audio is a garnish; a failed cue must never interrupt play.
      }
    },

    setEnabled(value: boolean): void {
      enabled = value;
      if (master) {
        master.gain.setTargetAtTime(value ? 0.5 : 0, context?.currentTime ?? 0, 0.015);
      }
      if (!value) return;
      this.unlock();
    },

    dispose(): void {
      gate.reset();
      const closing = context;
      context = null;
      master = null;
      noise = null;
      if (closing && closing.state !== 'closed') {
        void closing.close().catch(() => undefined);
      }
    },
  };
}
