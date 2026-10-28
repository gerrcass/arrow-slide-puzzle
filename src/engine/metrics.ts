import { clearanceFor } from './clearance';
import { bendCount, exitSteps } from './geometry';
import type { Board } from './types';

export interface LevelMetrics {
  readonly pieceCount: number;
  readonly initialClearCount: number;
  readonly totalCells: number;
  /** Occupied cells divided by board cells, rounded to three decimals. */
  readonly density: number;
  readonly averageLength: number;
  readonly longestPiece: number;
  readonly bendCount: number;
  readonly straightPieces: number;
  /** Blocked on the very first translated step. */
  readonly blockedAtFirstOffset: number;
  /** Blocked only after two or more translated steps — the "look twice" case. */
  readonly lateBlocked: number;
  /** Bent pieces plus pieces that are blocked late. */
  readonly nonObviousCount: number;
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function computeMetrics(board: Board): LevelMetrics {
  const pieceCount = board.pieces.length;
  let initialClearCount = 0;
  let totalCells = 0;
  let longestPiece = 0;
  let totalBends = 0;
  let straightPieces = 0;
  let blockedAtFirstOffset = 0;
  let lateBlocked = 0;
  let nonObviousCount = 0;

  for (const piece of board.pieces) {
    const others = board.pieces.filter((candidate) => candidate.id !== piece.id);
    const clearance = clearanceFor(piece, others, board.width, board.height);
    const bends = bendCount(piece.path);
    const length = piece.path.length;
    totalCells += length;
    totalBends += bends;
    if (bends === 0) straightPieces += 1;
    if (length > longestPiece) longestPiece = length;

    if (clearance.kind === 'clear') {
      initialClearCount += 1;
    } else if (clearance.offset === 1) {
      blockedAtFirstOffset += 1;
    } else {
      lateBlocked += 1;
    }

    if (bends > 0 || (clearance.kind === 'blocked' && clearance.offset > 1)) {
      nonObviousCount += 1;
    }
  }

  return {
    pieceCount,
    initialClearCount,
    totalCells,
    density: round(totalCells / (board.width * board.height), 3),
    averageLength: round(totalCells / Math.max(pieceCount, 1), 2),
    longestPiece,
    bendCount: totalBends,
    straightPieces,
    blockedAtFirstOffset,
    lateBlocked,
    nonObviousCount,
  };
}

/** Useful for generator review: the exit distance of every piece. */
export function exitStepsForBoard(board: Board): Readonly<Record<string, number>> {
  const result: Record<string, number> = {};
  for (const piece of board.pieces) {
    result[piece.id] = exitSteps(piece.path, piece.heading, board.width, board.height);
  }
  return result;
}
