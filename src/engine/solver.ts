import { clearanceFor } from './clearance';
import type { Board, Piece } from './types';

/**
 * Greedy clearing is complete because removal is monotonic (ADR-0002):
 * clearing a piece only frees cells, so it can never make another piece less
 * clear. If a clear piece exists, removing it is always safe.
 */
export function solveBoard(board: Board): readonly string[] | null {
  let remaining: readonly Piece[] = board.pieces;
  const order: string[] = [];

  while (remaining.length > 0) {
    const next = remaining.find((piece) => {
      const others = remaining.filter((candidate) => candidate.id !== piece.id);
      return (
        clearanceFor(piece, others, board.width, board.height).kind === 'clear'
      );
    });

    if (!next) return null;

    order.push(next.id);
    remaining = remaining.filter((piece) => piece.id !== next.id);
  }

  return order;
}

export function isSolvable(board: Board): boolean {
  return solveBoard(board) !== null;
}

/** A reverse-construction board lists its pieces in addition order. */
export function verifyRemovalOrder(
  board: Board,
  order: readonly string[],
): boolean {
  if (order.length !== board.pieces.length) return false;
  const unique = new Set(order);
  if (unique.size !== order.length) return false;

  let remaining: readonly Piece[] = board.pieces;
  for (const pieceId of order) {
    const piece = remaining.find((candidate) => candidate.id === pieceId);
    if (!piece) return false;
    const others = remaining.filter((candidate) => candidate.id !== pieceId);
    if (clearanceFor(piece, others, board.width, board.height).kind !== 'clear') {
      return false;
    }
    remaining = others;
  }

  return remaining.length === 0;
}
