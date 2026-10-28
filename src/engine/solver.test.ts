import { describe, expect, it } from 'vitest';
import { chainBoard, makeBoard, makePiece } from './fixtures';
import { isSolvable, solveBoard, verifyRemovalOrder } from './solver';

describe('solver', () => {
  it('clears a chain and returns every piece exactly once', () => {
    const order = solveBoard(chainBoard());
    expect(order).not.toBeNull();
    expect(order).toHaveLength(2);
    expect(new Set(order).size).toBe(2);
    expect(order?.[0]).toBe('front');
    expect(order?.[1]).toBe('back');
  });

  it('detects a mutual block as unsolvable', () => {
    const left = makePiece('left', [
      [0, 0],
      [1, 0],
    ]);
    const right = makePiece('right', [
      [2, 0],
      [3, 0],
    ], 'mint', 'left');
    const board = makeBoard(4, 4, [left, right]);
    expect(isSolvable(board)).toBe(false);
    expect(solveBoard(board)).toBeNull();
  });

  it('accepts a reverse-construction order as a valid solution', () => {
    const board = chainBoard();
    const order = [...board.pieces].reverse().map((piece) => piece.id);
    expect(verifyRemovalOrder(board, order)).toBe(true);
  });

  it('rejects an order that removes a blocked ribbon first', () => {
    const board = chainBoard();
    expect(verifyRemovalOrder(board, ['back', 'front'])).toBe(false);
  });

  it('rejects orders with duplicates or missing pieces', () => {
    const board = chainBoard();
    expect(verifyRemovalOrder(board, ['front', 'front'])).toBe(false);
    expect(verifyRemovalOrder(board, ['front'])).toBe(false);
  });

  it('solves a four-piece spiral board', () => {
    const a = makePiece('a', [
      [0, 0],
      [1, 0],
    ]);
    const b = makePiece('b', [
      [2, 0],
      [2, 1],
      [3, 1],
    ]);
    const c = makePiece('c', [
      [0, 2],
      [1, 2],
      [1, 3],
    ]);
    const d = makePiece('d', [
      [3, 2],
      [3, 3],
    ], 'mint', 'down');
    const board = makeBoard(4, 4, [a, b, c, d]);
    expect(isSolvable(board)).toBe(true);
    const order = solveBoard(board);
    expect(order).not.toBeNull();
    if (order) expect(verifyRemovalOrder(board, order)).toBe(true);
  });
});
