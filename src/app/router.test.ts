import { describe, expect, it } from 'vitest';
import { parseRoute, routeHash } from './router';

describe('hash routing', () => {
  it('treats an empty hash and #/ as home', () => {
    expect(parseRoute('', 1)).toEqual({ name: 'home' });
    expect(parseRoute('#/', 1)).toEqual({ name: 'home' });
    expect(parseRoute('#', 1)).toEqual({ name: 'home' });
  });

  it('maps one-based play URLs to zero-based level indexes', () => {
    expect(parseRoute('#/play/1', 12)).toEqual({ name: 'play', index: 0 });
    expect(parseRoute('#/play/12', 12)).toEqual({ name: 'play', index: 11 });
    expect(parseRoute('#/play/1/', 12)).toEqual({ name: 'play', index: 0 });
  });

  it('rejects zero, negative, fractional, and out-of-range level URLs', () => {
    expect(parseRoute('#/play/0', 12)).toEqual({ name: 'unknown' });
    expect(parseRoute('#/play/13', 12)).toEqual({ name: 'unknown' });
    expect(parseRoute('#/play/-1', 12)).toEqual({ name: 'unknown' });
    expect(parseRoute('#/play/1.5', 12)).toEqual({ name: 'unknown' });
  });

  it('rejects unknown routes', () => {
    expect(parseRoute('#/gallery', 12)).toEqual({ name: 'unknown' });
    expect(parseRoute('#/levels', 12)).toEqual({ name: 'unknown' });
    expect(parseRoute('#/play', 12)).toEqual({ name: 'unknown' });
  });

  it('builds route hashes', () => {
    expect(routeHash({ name: 'home' })).toBe('#/');
    expect(routeHash({ name: 'play', index: 0 })).toBe('#/play/1');
    expect(routeHash({ name: 'play', index: 11 })).toBe('#/play/12');
  });
});
