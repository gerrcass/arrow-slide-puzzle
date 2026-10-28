import type { Cell, Piece } from '../../engine/types';

/** The frost hole is almost exactly one cell wide, with round caps. */
export const REVEAL_STROKE_WIDTH = 0.9;
export const REVEAL_LINE_CAP = 'round';
export const REVEAL_DURATION_MS = 420;

export interface RevealHole {
  readonly pieceId: string;
  /** Hole centre-line, in board user units (cell centres). */
  readonly d: string;
  readonly strokeWidth: number;
  readonly durationMs: number;
  /** A one-cell ribbon leaves a dot rather than a line. */
  readonly singleCell: boolean;
}

function centre(cell: Cell): Cell {
  return { x: cell.x + 0.5, y: cell.y + 0.5 };
}

/**
 * The hole follows the exact cells the ribbon vacated, not its shortened
 * arrowhead. Rendering and reveal therefore share one geometry at every size.
 */
export function revealHolePath(cells: readonly Cell[]): string {
  const points = cells.map(centre);
  const [first, ...rest] = points;
  if (!first) return '';
  let d = `M ${first.x.toFixed(3)} ${first.y.toFixed(3)}`;
  if (rest.length === 0) {
    // A tiny stub keeps pathLength-based draw animations valid for a dot.
    return `${d} l 0.0001 0`;
  }
  for (const point of rest) {
    d += ` L ${point.x.toFixed(3)} ${point.y.toFixed(3)}`;
  }
  return d;
}

export function revealDuration(reduced: boolean): number {
  return reduced ? 0 : REVEAL_DURATION_MS;
}

export function revealHoleFor(piece: Piece, reduced = false): RevealHole {
  return {
    pieceId: piece.id,
    d: revealHolePath(piece.path),
    strokeWidth: REVEAL_STROKE_WIDTH,
    durationMs: revealDuration(reduced),
    singleCell: piece.path.length === 1,
  };
}

export function revealHolesFor(
  cleared: readonly Piece[],
  reduced = false,
): readonly RevealHole[] {
  return cleared.map((piece) => revealHoleFor(piece, reduced));
}
