import type { Constellation } from './schema';

/** Original inline constellation data. Art is drawn from these nodes. */
export const CONSTELLATIONS: readonly Constellation[] = [
  {
    id: 'the-pearl',
    name: 'The Pearl',
    caption: 'A small, quiet light that waits at the bottom of the sky.',
    accent: 'rose',
    stars: [
      { x: 0.5, y: 0.2, size: 1 },
      { x: 0.68, y: 0.34, size: 0.7 },
      { x: 0.62, y: 0.56, size: 0.85 },
      { x: 0.43, y: 0.66, size: 0.7 },
      { x: 0.3, y: 0.46, size: 0.8 },
      { x: 0.48, y: 0.47, size: 1.25 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
      [4, 5],
      [5, 0],
    ],
  },
];

export function constellationById(id: string): Constellation | null {
  return CONSTELLATIONS.find((constellation) => constellation.id === id) ?? null;
}
