import {
  HEADINGS,
  type Board,
  type Cell,
  type Heading,
  type Piece,
} from './types';

export const HEADING_VECTORS: Readonly<Record<Heading, Cell>> = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

export function cellKey(cell: Cell): string {
  return `${cell.x},${cell.y}`;
}

export function cellsEqual(a: Cell, b: Cell): boolean {
  return a.x === b.x && a.y === b.y;
}

export function translateCell(cell: Cell, heading: Heading, steps = 1): Cell {
  const vector = HEADING_VECTORS[heading];
  return { x: cell.x + vector.x * steps, y: cell.y + vector.y * steps };
}

export function translateCells(
  cells: readonly Cell[],
  heading: Heading,
  steps = 1,
): readonly Cell[] {
  return cells.map((cell) => translateCell(cell, heading, steps));
}

export function isInBounds(cell: Cell, width: number, height: number): boolean {
  return cell.x >= 0 && cell.y >= 0 && cell.x < width && cell.y < height;
}

export function directionBetween(from: Cell, to: Cell): Heading | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 1 && dy === 0) return 'right';
  if (dx === -1 && dy === 0) return 'left';
  if (dx === 0 && dy === 1) return 'down';
  if (dx === 0 && dy === -1) return 'up';
  return null;
}

/** The heading is the direction of the final segment. Singletons have no segment. */
export function deriveHeading(path: readonly Cell[]): Heading | null {
  if (path.length < 2) return null;
  const previous = path[path.length - 2];
  const head = path[path.length - 1];
  if (!previous || !head) return null;
  return directionBetween(previous, head);
}

export function pathDirections(path: readonly Cell[]): readonly Heading[] {
  const directions: Heading[] = [];
  for (let index = 1; index < path.length; index += 1) {
    const previous = path[index - 1];
    const next = path[index];
    if (!previous || !next) continue;
    const direction = directionBetween(previous, next);
    if (direction) directions.push(direction);
  }
  return directions;
}

export function isContiguous(path: readonly Cell[]): boolean {
  for (let index = 1; index < path.length; index += 1) {
    const previous = path[index - 1];
    const next = path[index];
    if (!previous || !next) return false;
    if (!directionBetween(previous, next)) return false;
  }
  return true;
}

export function isSelfAvoiding(path: readonly Cell[]): boolean {
  const seen = new Set<string>();
  for (const cell of path) {
    const key = cellKey(cell);
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return true;
}

export function isPathInBounds(
  path: readonly Cell[],
  width: number,
  height: number,
): boolean {
  return path.every((cell) => isInBounds(cell, width, height));
}

/**
 * How many cell translations are needed before every cell of the piece is
 * outside the board. This is the length of a full-exit clearance sweep.
 */
export function exitSteps(
  path: readonly Cell[],
  heading: Heading,
  width: number,
  height: number,
): number {
  let steps = 0;
  for (const cell of path) {
    let distance: number;
    switch (heading) {
      case 'right':
        distance = width - cell.x;
        break;
      case 'left':
        distance = cell.x + 1;
        break;
      case 'down':
        distance = height - cell.y;
        break;
      case 'up':
        distance = cell.y + 1;
        break;
    }
    if (distance > steps) steps = distance;
  }
  return steps;
}

export function bendCount(path: readonly Cell[]): number {
  const directions = pathDirections(path);
  let bends = 0;
  for (let index = 1; index < directions.length; index += 1) {
    if (directions[index] !== directions[index - 1]) bends += 1;
  }
  return bends;
}

export function pieceLength(piece: Piece): number {
  return piece.path.length;
}

export type GeometryIssue =
  | { readonly kind: 'empty-path'; readonly pieceId: string }
  | { readonly kind: 'out-of-bounds'; readonly pieceId: string; readonly cell: Cell }
  | { readonly kind: 'non-contiguous'; readonly pieceId: string; readonly cell: Cell }
  | { readonly kind: 'repeated-cell'; readonly pieceId: string; readonly cell: Cell }
  | { readonly kind: 'invalid-heading'; readonly pieceId: string; readonly heading: string }
  | {
      readonly kind: 'heading-mismatch';
      readonly pieceId: string;
      readonly declared: Heading;
      readonly derived: Heading;
    };

export function validatePieceGeometry(
  piece: Piece,
  width: number,
  height: number,
): readonly GeometryIssue[] {
  const issues: GeometryIssue[] = [];
  if (piece.path.length === 0) {
    issues.push({ kind: 'empty-path', pieceId: piece.id });
    return issues;
  }

  if (!HEADINGS.includes(piece.heading)) {
    issues.push({
      kind: 'invalid-heading',
      pieceId: piece.id,
      heading: String(piece.heading),
    });
  }

  const seen = new Set<string>();
  for (const cell of piece.path) {
    if (!isInBounds(cell, width, height)) {
      issues.push({ kind: 'out-of-bounds', pieceId: piece.id, cell });
    }
    const key = cellKey(cell);
    if (seen.has(key)) {
      issues.push({ kind: 'repeated-cell', pieceId: piece.id, cell });
    }
    seen.add(key);
  }

  for (let index = 1; index < piece.path.length; index += 1) {
    const previous = piece.path[index - 1];
    const next = piece.path[index];
    if (!previous || !next) continue;
    if (!directionBetween(previous, next)) {
      issues.push({ kind: 'non-contiguous', pieceId: piece.id, cell: next });
    }
  }

  if (piece.path.length >= 2) {
    const derived = deriveHeading(piece.path);
    if (derived && derived !== piece.heading) {
      issues.push({
        kind: 'heading-mismatch',
        pieceId: piece.id,
        declared: piece.heading,
        derived,
      });
    }
  }

  return issues;
}

export function findAllCells(
  board: Board,
  piece: Piece,
): ReadonlyMap<string, Piece> {
  const cells = new Map<string, Piece>();
  for (const other of board.pieces) {
    if (other.id === piece.id) continue;
    for (const cell of other.path) cells.set(cellKey(cell), other);
  }
  return cells;
}
