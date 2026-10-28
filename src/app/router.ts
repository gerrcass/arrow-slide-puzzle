export type Route =
  | { readonly name: 'home' }
  | { readonly name: 'levels' }
  | { readonly name: 'play'; readonly index: number };

export type ParsedRoute = Route | { readonly name: 'unknown' };

export interface RouteResolution {
  readonly route: Route;
  readonly replace?: boolean;
  readonly notice?: string;
}

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
  if (value === '/levels') return { name: 'levels' };

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
  if (route.name === 'levels') return '#/levels';
  return `#/play/${route.index + 1}`;
}

/**
 * A locked deep link is replaced with the level select and a notice. Unknown
 * routes fall back to the title screen. Neither can strand the player.
 */
export function resolveRoute(
  parsed: ParsedRoute,
  levelCount: number,
  isUnlocked: (index: number) => boolean,
): RouteResolution {
  if (parsed.name === 'unknown') {
    return { route: { name: 'home' }, replace: true };
  }
  if (parsed.name === 'play') {
    if (parsed.index < 0 || parsed.index >= levelCount) {
      return { route: { name: 'home' }, replace: true };
    }
    if (!isUnlocked(parsed.index)) {
      return {
        route: { name: 'levels' },
        replace: true,
        notice: 'That tangle is still locked. Complete the one before it first.',
      };
    }
  }
  return { route: parsed };
}
