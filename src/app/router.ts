export type Route =
  | { readonly name: 'home' }
  | { readonly name: 'play'; readonly index: number };

export type ParsedRoute = Route | { readonly name: 'unknown' };

function normalise(hash: string): string {
  let value = hash.startsWith('#') ? hash.slice(1) : hash;
  if (value.length === 0) return '/';
  if (!value.startsWith('/')) value = `/${value}`;
  if (value.length > 1 && value.endsWith('/')) value = value.slice(0, -1);
  return value;
}

/**
 * URLs are one-based (`#/play/1` is the first level) because they are
 * human-facing. The internal level index is zero-based.
 */
export function parseRoute(hash: string, levelCount: number): ParsedRoute {
  const value = normalise(hash);
  if (value === '/') return { name: 'home' };

  const playMatch = /^\/play\/(\d+)$/.exec(value);
  if (playMatch) {
    const humanIndex = Number(playMatch[1]);
    if (Number.isInteger(humanIndex) && humanIndex >= 1 && humanIndex <= levelCount) {
      return { name: 'play', index: humanIndex - 1 };
    }
    return { name: 'unknown' };
  }

  return { name: 'unknown' };
}

export function routeHash(route: Route): string {
  if (route.name === 'home') return '#/';
  return `#/play/${route.index + 1}`;
}
