import { deriveHeading, exitSteps } from './geometry';
import type { Board, Cell, Heading, Piece, RibbonColor } from './types';

export type Coord = readonly [number, number];

export function makePiece(
  id: string,
  coords: readonly Coord[],
  color: RibbonColor = 'rose',
  heading?: Heading,
): Piece {
  const path: readonly Cell[] = coords.map(([x, y]) => ({ x, y }));
  const resolvedHeading = heading ?? deriveHeading(path);
  if (!resolvedHeading) {
    throw new Error(`Piece ${id} needs an explicit heading for a singleton path`);
  }
  return { id, path, heading: resolvedHeading, color };
}

export function makeBoard(
  width: number,
  height: number,
  pieces: readonly Piece[],
): Board {
  return { width, height, pieces };
}

/** A two-piece chain: `front` is clear, `back` is blocked by it. */
export function chainBoard(): Board {
  const back = makePiece('back', [
    [0, 0],
    [1, 0],
  ]);
  const front = makePiece('front', [
    [2, 0],
    [3, 0],
  ]);
  return makeBoard(4, 4, [back, front]);
}

export function stepsFor(board: Board, pieceId: string, heading: Heading): number {
  const piece = board.pieces.find((candidate) => candidate.id === pieceId);
  if (!piece) throw new Error(`Missing piece ${pieceId}`);
  return exitSteps(piece.path, heading, board.width, board.height);
}
