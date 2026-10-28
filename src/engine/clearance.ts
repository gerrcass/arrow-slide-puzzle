import {
  cellKey,
  exitSteps,
  isInBounds,
  translateCell,
} from './geometry';
import type { Cell, Piece } from './types';

export type Clearance =
  | { readonly kind: 'clear'; readonly steps: number }
  | {
      readonly kind: 'blocked';
      readonly blockerId: string;
      readonly offset: number;
      /** The board cell occupied by the blocker at the first collision. */
      readonly blockerCell: Cell;
    };

interface Occupancy {
  readonly cells: ReadonlyMap<string, string>;
  readonly order: readonly string[];
}

function buildOccupancy(others: readonly Piece[]): Occupancy {
  const cells = new Map<string, string>();
  const order: string[] = [];
  for (const piece of others) {
    order.push(piece.id);
    for (const cell of piece.path) {
      const key = cellKey(cell);
      if (!cells.has(key)) cells.set(key, piece.id);
    }
  }
  return { cells, order };
}

/**
 * Rigid translation along the heading, one cell at a time, until the whole
 * piece is off the board. The first overlap with another piece blocks the move.
 * The piece's own cells never count as obstacles.
 */
export function clearanceFor(
  piece: Piece,
  others: readonly Piece[],
  width: number,
  height: number,
): Clearance {
  const steps = exitSteps(piece.path, piece.heading, width, height);
  const occupancy = buildOccupancy(others);

  for (let offset = 1; offset <= steps; offset += 1) {
    for (const cell of piece.path) {
      const translated = translateCell(cell, piece.heading, offset);
      if (!isInBounds(translated, width, height)) continue;
      const blockerId = occupancy.cells.get(cellKey(translated));
      if (blockerId) {
        return { kind: 'blocked', blockerId, offset, blockerCell: translated };
      }
    }
  }

  return { kind: 'clear', steps };
}

export function isClear(
  piece: Piece,
  others: readonly Piece[],
  width: number,
  height: number,
): boolean {
  return clearanceFor(piece, others, width, height).kind === 'clear';
}

export interface LegalMove {
  readonly piece: Piece;
  readonly steps: number;
}

/** Every piece whose sweep succeeds, in board order. */
export function legalMoves(
  pieces: readonly Piece[],
  width: number,
  height: number,
): readonly LegalMove[] {
  const moves: LegalMove[] = [];
  for (const piece of pieces) {
    const others = pieces.filter((other) => other.id !== piece.id);
    const clearance = clearanceFor(piece, others, width, height);
    if (clearance.kind === 'clear') moves.push({ piece, steps: clearance.steps });
  }
  return moves;
}

/** The in-board cells a piece would sweep through before fully exiting. */
export function sweptCells(
  piece: Piece,
  width: number,
  height: number,
): ReadonlySet<string> {
  const steps = exitSteps(piece.path, piece.heading, width, height);
  const cells = new Set<string>();
  for (let offset = 1; offset < steps; offset += 1) {
    for (const cell of piece.path) {
      const translated = translateCell(cell, piece.heading, offset);
      if (isInBounds(translated, width, height)) cells.add(cellKey(translated));
    }
  }
  return cells;
}
