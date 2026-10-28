import { describe, expect, it } from 'vitest';
import { resolveReducedMotion } from './motion';

describe('motion preference', () => {
  it('lets an explicit app choice override the device preference', () => {
    expect(resolveReducedMotion('reduced', false)).toBe(true);
    expect(resolveReducedMotion('full', true)).toBe(false);
  });

  it('follows the device preference when the app choice is system', () => {
    expect(resolveReducedMotion('system', true)).toBe(true);
    expect(resolveReducedMotion('system', false)).toBe(false);
  });
});
