import { describe, expect, it } from 'vitest';
import { resolveReducedMotion, type MotionSetting } from './motion';

describe('motion preference', () => {
  it('covers all three settings against both device preferences', () => {
    const cases: readonly [
      MotionSetting,
      boolean,
      boolean,
      string,
    ][] = [
      ['system', false, false, 'system follows a calm device'],
      ['system', true, true, 'system follows a reduced-motion device'],
      ['reduced', false, true, 'reduced overrides a full-motion device'],
      ['reduced', true, true, 'reduced stays reduced'],
      ['full', false, false, 'full stays full'],
      ['full', true, false, 'full overrides a reduced-motion device'],
    ];

    for (const [setting, device, expected, label] of cases) {
      expect(resolveReducedMotion(setting, device), label).toBe(expected);
    }
  });

  it('lets an explicit app choice override the device preference', () => {
    expect(resolveReducedMotion('reduced', false)).toBe(true);
    expect(resolveReducedMotion('full', true)).toBe(false);
  });

  it('follows the device preference when the app choice is system', () => {
    expect(resolveReducedMotion('system', true)).toBe(true);
    expect(resolveReducedMotion('system', false)).toBe(false);
  });
});
