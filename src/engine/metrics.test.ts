import { describe, expect, it } from 'vitest';
import { computeMetrics, exitStepsForBoard } from './metrics';
import { chainBoard, makeBoard, makePiece } from './fixtures';

describe('difficulty metrics', () => {
  it('computes counts, density, and clearance buckets', () => {
    const metrics = computeMetrics(chainBoard());
    expect(metrics.pieceCount).toBe(2);
    expect(metrics.initialClearCount).toBe(1);
    expect(metrics.totalCells).toBe(4);
    expect(metrics.density).toBe(0.25);
    expect(metrics.averageLength).toBe(2);
    expect(metrics.longestPiece).toBe(2);
    expect(metrics.bendCount).toBe(0);
    expect(metrics.straightPieces).toBe(2);
    expect(metrics.blockedAtFirstOffset).toBe(1);
    expect(metrics.lateBlocked).toBe(0);
    expect(metrics.nonObviousCount).toBe(0);
  });

  it('counts bent and late-blocked pieces as non-obvious', () => {
    const bent = makePiece('bent', [
      [0, 0],
      [1, 0],
      [1, 1],
    ]);
    const late = makePiece('late', [
      [2, 5],
      [3, 5],
    ]);
    const blocker = makePiece('blocker', [[5, 5]], 'mint', 'up');
    const board = makeBoard(6, 6, [bent, late, blocker]);
    const metrics = computeMetrics(board);
    expect(metrics.bendCount).toBe(1);
    expect(metrics.lateBlocked).toBe(1);
    expect(metrics.nonObviousCount).toBe(2);
  });

  it('reports exit distance per piece', () => {
    const board = makeBoard(4, 4, [
      makePiece('a', [
        [0, 0],
        [1, 0],
      ]),
      makePiece('b', [[3, 3]], 'mint', 'down'),
    ]);
    expect(exitStepsForBoard(board)).toEqual({ a: 4, b: 1 });
  });
});
