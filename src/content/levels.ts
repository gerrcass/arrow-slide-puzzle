import { assertValidLevels } from './validate';
import { makeLevel } from './levelBuilder';
import type { Level } from './schema';

/**
 * The playable tangle for the core loop. Ticket 02 replaces this single
 * handcrafted level with the twelve seeded, solver-verified campaign levels.
 *
 * Pieces are listed in reverse-construction order: each was added while it
 * could still exit past the pieces already placed. Removing them in reverse
 * order therefore clears the board.
 */
export const LEVELS: readonly Level[] = [
  makeLevel(0, 'Pearl’s First Bow', 'the-pearl', 1, {
    width: 6,
    height: 6,
    pieces: [
      {
        id: 'p1',
        path: [
          { x: 1, y: 1 },
          { x: 2, y: 1 },
          { x: 2, y: 2 },
          { x: 3, y: 2 },
        ],
        heading: 'right',
        color: 'rose',
      },
      {
        id: 'p2',
        path: [
          { x: 2, y: 4 },
          { x: 2, y: 3 },
          { x: 3, y: 3 },
        ],
        heading: 'right',
        color: 'peach',
      },
      {
        id: 'p3',
        path: [
          { x: 4, y: 0 },
          { x: 4, y: 1 },
          { x: 4, y: 2 },
          { x: 4, y: 3 },
        ],
        heading: 'down',
        color: 'butter',
      },
      {
        id: 'p4',
        path: [
          { x: 5, y: 5 },
          { x: 4, y: 5 },
        ],
        heading: 'left',
        color: 'mint',
      },
      {
        id: 'p5',
        path: [
          { x: 1, y: 3 },
          { x: 1, y: 4 },
          { x: 1, y: 5 },
        ],
        heading: 'down',
        color: 'lilac',
      },
      {
        id: 'p6',
        path: [
          { x: 0, y: 5 },
          { x: 0, y: 4 },
          { x: 0, y: 3 },
        ],
        heading: 'up',
        color: 'sky',
      },
    ],
  }),
];

assertValidLevels(LEVELS);
