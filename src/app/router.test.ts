import { describe, expect, it } from 'vitest';
import { parseRoute, resolveRoute, routeHash } from './router';

const LEVEL_COUNT = 12;

describe('hash routing', () => {
  it('treats an empty hash and #/ as home', () => {
    expect(parseRoute('', LEVEL_COUNT)).toEqual({ name: 'home' });
    expect(parseRoute('#/', LEVEL_COUNT)).toEqual({ name: 'home' });
    expect(parseRoute('#', LEVEL_COUNT)).toEqual({ name: 'home' });
  });

  it('parses the level select and gallery routes', () => {
    expect(parseRoute('#/levels', LEVEL_COUNT)).toEqual({ name: 'levels' });
    expect(parseRoute('#/levels/', LEVEL_COUNT)).toEqual({ name: 'levels' });
    expect(parseRoute('#/gallery', LEVEL_COUNT)).toEqual({ name: 'gallery' });
    expect(parseRoute('#/gallery/', LEVEL_COUNT)).toEqual({ name: 'gallery' });
  });

  it('maps one-based play URLs to zero-based level indexes', () => {
    expect(parseRoute('#/play/1', LEVEL_COUNT)).toEqual({ name: 'play', index: 0 });
    expect(parseRoute('#/play/12', LEVEL_COUNT)).toEqual({ name: 'play', index: 11 });
    expect(parseRoute('#/play/1/', LEVEL_COUNT)).toEqual({ name: 'play', index: 0 });
  });

  it('rejects zero, negative, fractional, and out-of-range level URLs', () => {
    expect(parseRoute('#/play/0', LEVEL_COUNT)).toEqual({ name: 'unknown' });
    expect(parseRoute('#/play/13', LEVEL_COUNT)).toEqual({ name: 'unknown' });
    expect(parseRoute('#/play/-1', LEVEL_COUNT)).toEqual({ name: 'unknown' });
    expect(parseRoute('#/play/1.5', LEVEL_COUNT)).toEqual({ name: 'unknown' });
  });

  it('rejects unknown routes', () => {
    expect(parseRoute('#/unknown', LEVEL_COUNT)).toEqual({ name: 'unknown' });
    expect(parseRoute('#/play', LEVEL_COUNT)).toEqual({ name: 'unknown' });
  });

  it('builds route hashes', () => {
    expect(routeHash({ name: 'home' })).toBe('#/');
    expect(routeHash({ name: 'levels' })).toBe('#/levels');
    expect(routeHash({ name: 'gallery' })).toBe('#/gallery');
    expect(routeHash({ name: 'play', index: 0 })).toBe('#/play/1');
    expect(routeHash({ name: 'play', index: 11 })).toBe('#/play/12');
  });
});

describe('safe route resolution', () => {
  const unlocked = (index: number): boolean => index < 2;

  it('passes through home, levels, gallery, and unlocked play routes', () => {
    expect(resolveRoute({ name: 'home' }, LEVEL_COUNT, unlocked)).toEqual({
      route: { name: 'home' },
    });
    expect(resolveRoute({ name: 'levels' }, LEVEL_COUNT, unlocked)).toEqual({
      route: { name: 'levels' },
    });
    expect(resolveRoute({ name: 'gallery' }, LEVEL_COUNT, unlocked)).toEqual({
      route: { name: 'gallery' },
    });
    expect(resolveRoute({ name: 'play', index: 0 }, LEVEL_COUNT, unlocked)).toEqual({
      route: { name: 'play', index: 0 },
    });
  });

  it('redirects a locked deep link to the level select with a notice', () => {
    expect(resolveRoute({ name: 'play', index: 2 }, LEVEL_COUNT, unlocked)).toEqual({
      route: { name: 'levels' },
      replace: true,
      notice: 'That tangle is still locked. Complete the one before it first.',
    });
  });

  it('redirects unknown routes home', () => {
    expect(resolveRoute({ name: 'unknown' }, LEVEL_COUNT, unlocked)).toEqual({
      route: { name: 'home' },
      replace: true,
    });
  });

  it('redirects impossible play indexes home', () => {
    expect(resolveRoute({ name: 'play', index: 99 }, LEVEL_COUNT, unlocked)).toEqual({
      route: { name: 'home' },
      replace: true,
    });
  });
});
