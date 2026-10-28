import { describe, expect, it } from 'vitest';
import { makePiece } from '../../engine/fixtures';
import {
  REVEAL_DURATION_MS,
  REVEAL_LINE_CAP,
  REVEAL_STROKE_WIDTH,
  revealDuration,
  revealHoleFor,
  revealHolePath,
  revealHolesFor,
} from './reveal';

describe('frost reveal geometry', () => {
  it('draws a hole through the exact cell centres a ribbon vacated', () => {
    const piece = makePiece('bent', [
      [0, 0],
      [0, 1],
      [1, 1],
    ]);

    expect(revealHolePath(piece.path)).toBe(
      'M 0.500 0.500 L 0.500 1.500 L 1.500 1.500',
    );
  });

  it('uses a round-capped stroke close to one cell wide', () => {
    expect(REVEAL_STROKE_WIDTH).toBe(0.9);
    expect(REVEAL_LINE_CAP).toBe('round');
  });

  it('leaves a dot with a valid path length for a single-cell ribbon', () => {
    const piece = makePiece('dot', [[2, 3]], 'mint', 'up');
    const hole = revealHoleFor(piece);

    expect(hole.d).toBe('M 2.500 3.500 l 0.0001 0');
    expect(hole.singleCell).toBe(true);
    expect(hole.strokeWidth).toBe(REVEAL_STROKE_WIDTH);
    expect(hole.pieceId).toBe('dot');
  });

  it('opens over 420ms, or instantly when motion is reduced', () => {
    const piece = makePiece('straight', [
      [1, 1],
      [2, 1],
    ]);

    expect(revealDuration(false)).toBe(REVEAL_DURATION_MS);
    expect(revealDuration(true)).toBe(0);
    expect(revealHoleFor(piece, false).durationMs).toBe(420);
    expect(revealHoleFor(piece, true).durationMs).toBe(0);
  });

  it('produces one hole per cleared ribbon, in clear order', () => {
    const first = makePiece('first', [[0, 0]], 'rose', 'up');
    const second = makePiece('second', [
      [2, 2],
      [2, 3],
    ]);

    const holes = revealHolesFor([first, second]);
    expect(holes.map((hole) => hole.pieceId)).toEqual(['first', 'second']);
    expect(holes).toHaveLength(2);
  });
});
