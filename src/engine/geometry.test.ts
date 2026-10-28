import { describe, expect, it } from 'vitest';
import {
  bendCount,
  deriveHeading,
  directionBetween,
  exitSteps,
  isContiguous,
  isInBounds,
  isSelfAvoiding,
  validatePieceGeometry,
} from './geometry';
import { makePiece } from './fixtures';

describe('heading and path geometry', () => {
  it('derives the heading from the final segment, not the first', () => {
    const path = [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ];
    expect(deriveHeading(path)).toBe('right');
  });

  it('derives all four headings', () => {
    expect(directionBetween({ x: 1, y: 1 }, { x: 1, y: 0 })).toBe('up');
    expect(directionBetween({ x: 1, y: 1 }, { x: 2, y: 1 })).toBe('right');
    expect(directionBetween({ x: 1, y: 1 }, { x: 1, y: 2 })).toBe('down');
    expect(directionBetween({ x: 1, y: 1 }, { x: 0, y: 1 })).toBe('left');
  });

  it('treats a single cell as having no derivable heading', () => {
    expect(deriveHeading([{ x: 2, y: 2 }])).toBeNull();
  });

  it('rejects diagonal and repeated cells', () => {
    expect(
      isContiguous([
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ]),
    ).toBe(false);
    expect(
      isSelfAvoiding([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 0 },
      ]),
    ).toBe(false);
  });

  it('counts bends in a path', () => {
    expect(
      bendCount([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
      ]),
    ).toBe(0);
    expect(
      bendCount([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ]),
    ).toBe(2);
  });

  it('validates an in-bounds, self-avoiding, heading-consistent ribbon', () => {
    const piece = makePiece('ok', [
      [0, 0],
      [1, 0],
      [1, 1],
    ]);
    expect(validatePieceGeometry(piece, 4, 4)).toEqual([]);
  });

  it('reports out-of-bounds, repeated, non-contiguous, and heading errors', () => {
    const outOfBounds = makePiece('oob', [
      [4, 0],
      [3, 0],
    ]);
    expect(validatePieceGeometry(outOfBounds, 4, 4).map((issue) => issue.kind)).toContain(
      'out-of-bounds',
    );

    const repeated = makePiece('repeat', [
      [0, 0],
      [1, 0],
      [1, 1],
      [1, 0],
    ]);
    expect(validatePieceGeometry(repeated, 4, 4).map((issue) => issue.kind)).toContain(
      'repeated-cell',
    );

    const diagonal = makePiece('diagonal', [
      [0, 0],
      [1, 1],
    ], 'rose', 'right');
    expect(validatePieceGeometry(diagonal, 4, 4).map((issue) => issue.kind)).toContain(
      'non-contiguous',
    );

    const mismatch = makePiece('mismatch', [
      [0, 0],
      [1, 0],
    ], 'rose', 'left');
    expect(validatePieceGeometry(mismatch, 4, 4).map((issue) => issue.kind)).toContain(
      'heading-mismatch',
    );
  });

  it('accepts a singleton with an explicit heading', () => {
    const piece = makePiece('dot', [[2, 2]], 'mint', 'up');
    expect(validatePieceGeometry(piece, 4, 4)).toEqual([]);
    expect(deriveHeading(piece.path)).toBeNull();
  });
});

describe('exit steps', () => {
  it('measures the longest distance of any cell to the exit edge', () => {
    const path = [
      { x: 1, y: 2 },
      { x: 1, y: 3 },
    ];
    expect(exitSteps(path, 'down', 5, 5)).toBe(3);
    expect(exitSteps(path, 'right', 5, 5)).toBe(4);
    expect(exitSteps(path, 'left', 5, 5)).toBe(2);
    expect(exitSteps(path, 'up', 5, 5)).toBe(4);
  });

  it('returns one for a cell on the exit edge', () => {
    expect(exitSteps([{ x: 0, y: 0 }], 'up', 4, 4)).toBe(1);
    expect(exitSteps([{ x: 3, y: 3 }], 'down', 4, 4)).toBe(1);
    expect(exitSteps([{ x: 0, y: 2 }], 'left', 4, 4)).toBe(1);
    expect(exitSteps([{ x: 3, y: 2 }], 'right', 4, 4)).toBe(1);
  });
});

describe('bounds', () => {
  it('checks the four corners and the first outside cell', () => {
    expect(isInBounds({ x: 0, y: 0 }, 4, 4)).toBe(true);
    expect(isInBounds({ x: 3, y: 3 }, 4, 4)).toBe(true);
    expect(isInBounds({ x: 4, y: 3 }, 4, 4)).toBe(false);
    expect(isInBounds({ x: -1, y: 0 }, 4, 4)).toBe(false);
  });
});
