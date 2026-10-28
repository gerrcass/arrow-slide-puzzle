import { describe, expect, it } from 'vitest';
import {
  clearanceFor,
  isClear,
  legalMoves,
  sweptCells,
} from './clearance';
import { cellKey } from './geometry';
import { makeBoard, makePiece } from './fixtures';
import type { Board, Piece } from './types';

function clear(piece: Piece, board: Board) {
  const others = board.pieces.filter((candidate) => candidate.id !== piece.id);
  return clearanceFor(piece, others, board.width, board.height);
}

describe('full-exit clearance', () => {
  it('a straight ribbon on an empty board is clear', () => {
    const piece = makePiece('a', [
      [0, 0],
      [1, 0],
    ]);
    const board = makeBoard(4, 4, [piece]);
    expect(clear(piece, board)).toEqual({ kind: 'clear', steps: 4 });
  });

  it('a bent ribbon must translate its whole footprint, not crawl its curve', () => {
    const piece = makePiece('bent', [
      [0, 0],
      [1, 0],
      [1, 1],
    ]);
    const board = makeBoard(3, 3, [piece]);
    expect(clear(piece, board)).toEqual({ kind: 'clear', steps: 3 });
  });

  it('a ribbon near the exit edge needs fewer steps', () => {
    const piece = makePiece('edge', [
      [2, 2],
      [3, 2],
    ]);
    const board = makeBoard(4, 4, [piece]);
    expect(clear(piece, board)).toEqual({ kind: 'clear', steps: 2 });
  });

  it('a blocker immediately ahead blocks at offset one', () => {
    const a = makePiece('a', [
      [0, 0],
      [1, 0],
    ]);
    const b = makePiece('b', [
      [2, 0],
      [3, 0],
    ], 'mint', 'left');
    const board = makeBoard(4, 4, [a, b]);
    expect(clear(a, board)).toEqual({
      kind: 'blocked',
      blockerId: 'b',
      offset: 1,
      blockerCell: { x: 2, y: 0 },
    });
  });

  it('a blocker several cells ahead blocks late, after the tip looked free', () => {
    const a = makePiece('a', [
      [0, 0],
      [1, 0],
    ]);
    const blocker = makePiece('blocker', [[3, 0]], 'mint', 'up');
    const board = makeBoard(5, 5, [a, blocker]);
    expect(clear(a, board)).toMatchObject({
      kind: 'blocked',
      blockerId: 'blocker',
      offset: 2,
    });
  });

  it('a bent ribbon can be blocked by a cell three offsets away', () => {
    const a = makePiece('a', [
      [0, 0],
      [1, 0],
      [1, 1],
    ]);
    const blocker = makePiece('blocker', [[1, 4]], 'sky', 'left');
    const board = makeBoard(6, 6, [a, blocker]);
    expect(clear(a, board)).toMatchObject({
      kind: 'blocked',
      blockerId: 'blocker',
      offset: 3,
    });
  });

  it('a single-cell ribbon is clear on an empty board', () => {
    const piece = makePiece('dot', [[2, 2]], 'butter', 'left');
    const board = makeBoard(4, 4, [piece]);
    expect(clear(piece, board)).toEqual({ kind: 'clear', steps: 3 });
  });

  it('a single-cell ribbon can be blocked', () => {
    const piece = makePiece('dot', [[2, 2]], 'butter', 'left');
    const blocker = makePiece('blocker', [[0, 2]], 'mint', 'up');
    const board = makeBoard(4, 4, [piece, blocker]);
    expect(clear(piece, board)).toMatchObject({
      kind: 'blocked',
      blockerId: 'blocker',
      offset: 2,
    });
  });

  it('does not treat a piece’s own translated cells as blockers', () => {
    const tangled = makePiece('tangled', [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
      [2, 0],
    ]);
    const board = makeBoard(4, 4, [tangled]);
    expect(clear(tangled, board).kind).toBe('clear');
  });

  it('reports the first blocker, not a later one', () => {
    const a = makePiece('a', [[0, 0]], 'rose', 'right');
    const first = makePiece('first', [[1, 0]], 'mint', 'up');
    const second = makePiece('second', [[3, 0]], 'sky', 'up');
    const board = makeBoard(4, 4, [a, first, second]);
    expect(clear(a, board)).toMatchObject({
      kind: 'blocked',
      blockerId: 'first',
      offset: 1,
    });
  });

  it('works for ribbons pressed against every edge', () => {
    const top = makePiece('top', [[1, 0]], 'rose', 'up');
    const bottom = makePiece('bottom', [[1, 3]], 'mint', 'down');
    const left = makePiece('left', [[0, 2]], 'sky', 'left');
    const right = makePiece('right', [[3, 1]], 'butter', 'right');
    const board = makeBoard(4, 4, [top, bottom, left, right]);
    for (const piece of board.pieces) {
      expect(clear(piece, board)).toEqual({ kind: 'clear', steps: 1 });
    }
  });

  it('legal moves are exactly the clear pieces', () => {
    const back = makePiece('back', [
      [0, 0],
      [1, 0],
    ]);
    const front = makePiece('front', [
      [2, 0],
      [3, 0],
    ]);
    const independent = makePiece('independent', [
      [0, 3],
      [1, 3],
    ]);
    const board = makeBoard(4, 4, [back, front, independent]);
    expect(legalMoves(board.pieces, 4, 4).map((move) => move.piece.id)).toEqual([
      'front',
      'independent',
    ]);
  });

  it('swept cells cover the field between the ribbon and the exit', () => {
    const piece = makePiece('a', [
      [0, 0],
      [1, 0],
    ]);
    const swept = sweptCells(piece, 4, 4);
    expect(swept.has(cellKey({ x: 2, y: 0 }))).toBe(true);
    expect(swept.has(cellKey({ x: 3, y: 0 }))).toBe(true);
    expect(swept.has(cellKey({ x: 0, y: 0 }))).toBe(false);
  });

  it('removing a clear ribbon never makes another ribbon less clear', () => {
    const back = makePiece('back', [
      [0, 0],
      [1, 0],
    ]);
    const front = makePiece('front', [
      [2, 0],
      [3, 0],
    ]);
    const independent = makePiece('independent', [
      [0, 3],
      [1, 3],
    ]);
    const board = makeBoard(4, 4, [back, front, independent]);
    const before = board.pieces.filter((piece) => isClear(piece, board.pieces.filter((other) => other.id !== piece.id), 4, 4));
    const beforeIds = new Set(before.map((piece) => piece.id));
    for (const removed of before) {
      const remaining = board.pieces.filter((piece) => piece.id !== removed.id);
      for (const piece of remaining) {
        if (!beforeIds.has(piece.id)) continue;
        const others = remaining.filter((other) => other.id !== piece.id);
        expect(isClear(piece, others, 4, 4)).toBe(true);
      }
    }
  });
});
