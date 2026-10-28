import { describe, expect, it } from 'vitest';
import { SoundGate, slideDurationSeconds } from './audio';

describe('audio cue guard', () => {
  it('lets one cue through per action and suppresses duplicates', () => {
    const gate = new SoundGate();
    expect(gate.shouldPlay('slide', 1000)).toBe(true);
    expect(gate.shouldPlay('slide', 1040)).toBe(false);
    expect(gate.shouldPlay('slide', 1180)).toBe(true);
  });

  it('gates each cue independently', () => {
    const gate = new SoundGate();
    expect(gate.shouldPlay('bump', 500)).toBe(true);
    expect(gate.shouldPlay('heart', 505)).toBe(true);
    expect(gate.shouldPlay('bump', 520)).toBe(false);
  });

  it('only allows one win arpeggio after the result settles', () => {
    const gate = new SoundGate();
    expect(gate.shouldPlay('win', 0)).toBe(true);
    expect(gate.shouldPlay('win', 800)).toBe(false);
    expect(gate.shouldPlay('win', 1300)).toBe(true);
  });

  it('scales the whoosh by slide travel and clamps dense boards', () => {
    expect(slideDurationSeconds(1)).toBeGreaterThan(0.18);
    expect(slideDurationSeconds(4)).toBeGreaterThan(slideDurationSeconds(1));
    expect(slideDurationSeconds(20)).toBe(slideDurationSeconds(8));
  });
});
