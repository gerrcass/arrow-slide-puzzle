import { clearanceFor, sweptCells } from '../engine/clearance';
import {
  cellKey,
  deriveHeading,
  HEADING_VECTORS,
  isInBounds,
} from '../engine/geometry';
import { computeMetrics } from '../engine/metrics';
import { verifyRemovalOrder } from '../engine/solver';
import {
  HEADINGS,
  RIBBON_COLORS,
  type Board,
  type Cell,
  type Heading,
  type Piece,
  type RibbonColor,
} from '../engine/types';
import { createRandom, randomInt, shuffle } from './prng';
import type { GenerationProfile } from './config';

export interface GenerateOptions extends GenerationProfile {
  readonly seed: number;
  readonly width: number;
  readonly height: number;
  readonly targetPieces: number;
}

interface PendingPiece {
  readonly id: string;
  readonly path: readonly Cell[];
  readonly heading: Heading;
}

interface Candidate {
  readonly path: readonly Cell[];
  readonly heading: Heading;
  readonly blockedClears: number;
}

interface OrganicContext {
  readonly occupied: readonly (readonly boolean[])[];
  readonly starts: Readonly<Record<Heading, readonly Cell[]>>;
  readonly canPlace: (cell: Cell, heading: Heading) => boolean;
  readonly clearSweeps: readonly ReadonlySet<string>[];
}

function makePiece(pending: PendingPiece, color: RibbonColor): Piece {
  return {
    id: pending.id,
    path: pending.path,
    heading: pending.heading,
    color,
  };
}

function isFree(
  occupied: readonly (readonly boolean[])[],
  cell: Cell,
  width: number,
  height: number,
): boolean {
  if (!isInBounds(cell, width, height)) return false;
  return !(occupied[cell.y]?.[cell.x] ?? true);
}

function buildOccupied(
  placed: readonly PendingPiece[],
  width: number,
  height: number,
): boolean[][] {
  const occupied = Array.from({ length: height }, () =>
    Array<boolean>(width).fill(false),
  );
  for (const piece of placed) {
    for (const cell of piece.path) {
      const row = occupied[cell.y];
      if (row) row[cell.x] = true;
    }
  }
  return occupied;
}

function buildOrganicContext(
  placed: readonly PendingPiece[],
  width: number,
  height: number,
): OrganicContext {
  const occupied = buildOccupied(placed, width, height);
  const rightMax = Array<number>(height).fill(-1);
  const leftMin = Array<number>(height).fill(width);
  const downMax = Array<number>(width).fill(-1);
  const upMin = Array<number>(width).fill(height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!(occupied[y]?.[x] ?? false)) continue;
      if (x > (rightMax[y] ?? -1)) rightMax[y] = x;
      if (x < (leftMin[y] ?? width)) leftMin[y] = x;
      if (y > (downMax[x] ?? -1)) downMax[x] = y;
      if (y < (upMin[x] ?? height)) upMin[x] = y;
    }
  }

  const canPlace = (cell: Cell, heading: Heading): boolean => {
    switch (heading) {
      case 'right':
        return cell.x > (rightMax[cell.y] ?? -1);
      case 'left':
        return cell.x < (leftMin[cell.y] ?? width);
      case 'down':
        return cell.y > (downMax[cell.x] ?? -1);
      case 'up':
        return cell.y < (upMin[cell.x] ?? height);
    }
  };

  const starts = {} as Record<Heading, Cell[]>;
  for (const heading of HEADINGS) {
    const cells: Cell[] = [];
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (occupied[y]?.[x] ?? false) continue;
        if (canPlace({ x, y }, heading)) cells.push({ x, y });
      }
    }
    starts[heading] = cells;
  }

  const tempPieces = placed.map((piece) => makePiece(piece, 'rose'));
  const clearSweeps: ReadonlySet<string>[] = [];
  placed.forEach((_, index) => {
    const piece = tempPieces[index];
    if (!piece) return;
    const others = tempPieces.filter((_, otherIndex) => otherIndex !== index);
    const clearance = clearanceFor(piece, others, width, height);
    if (clearance.kind === 'clear') {
      clearSweeps.push(sweptCells(piece, width, height));
    }
  });

  return { occupied, starts, canPlace, clearSweeps };
}

function randomPath(
  random: () => number,
  start: Cell,
  heading: Heading,
  length: number,
  width: number,
  height: number,
  occupied: readonly (readonly boolean[])[],
  canPlace: (cell: Cell, heading: Heading) => boolean,
): readonly Cell[] | null {
  const path: Cell[] = [start];
  const seen = new Set<string>([cellKey(start)]);

  while (path.length < length) {
    const current = path[path.length - 1];
    if (!current) return null;
    const finalStep = path.length === length - 1;
    const options: Cell[] = [];

    for (const direction of HEADINGS) {
      if (finalStep && direction !== heading) continue;
      const vector = HEADING_VECTORS[direction];
      const next = { x: current.x + vector.x, y: current.y + vector.y };
      if (!isInBounds(next, width, height)) continue;
      if (seen.has(cellKey(next))) continue;
      if (!isFree(occupied, next, width, height)) continue;
      if (!canPlace(next, heading)) continue;
      options.push(next);
    }

    if (options.length === 0) return null;
    const next = options[randomInt(random, 0, options.length - 1)];
    if (!next) return null;
    path.push(next);
    seen.add(cellKey(next));
  }

  return deriveHeading(path) === heading ? path : null;
}

function scoreCandidate(
  path: readonly Cell[],
  clearSweeps: readonly ReadonlySet<string>[],
): number {
  const cells = new Set(path.map(cellKey));
  let blocked = 0;
  for (const sweep of clearSweeps) {
    for (const key of cells) {
      if (sweep.has(key)) {
        blocked += 1;
        break;
      }
    }
  }
  return blocked;
}

function generateOrganic(options: GenerateOptions): Board | null {
  const random = createRandom(options.seed);
  const placed: PendingPiece[] = [];

  while (placed.length < options.targetPieces) {
    const context = buildOrganicContext(placed, options.width, options.height);
    const tempPieces = placed.map((piece) => makePiece(piece, 'rose'));
    const candidates: Candidate[] = [];

    for (let sample = 0; sample < options.samplesPerPiece; sample += 1) {
      const heading = HEADINGS[randomInt(random, 0, HEADINGS.length - 1)] ?? 'right';
      const starts = context.starts[heading];
      if (starts.length === 0) continue;
      const start = starts[randomInt(random, 0, starts.length - 1)];
      if (!start) continue;
      const length = randomInt(random, options.minLength, options.maxLength);
      const path = randomPath(
        random,
        start,
        heading,
        length,
        options.width,
        options.height,
        context.occupied,
        context.canPlace,
      );
      if (!path) continue;

      const candidate = makePiece(
        {
          id: `candidate-${placed.length}`,
          path,
          heading,
        },
        'rose',
      );
      if (
        clearanceFor(candidate, tempPieces, options.width, options.height).kind !==
        'clear'
      ) {
        continue;
      }

      candidates.push({
        path,
        heading,
        blockedClears: scoreCandidate(path, context.clearSweeps),
      });
    }

    if (candidates.length === 0) return null;
    const maxBlocked = Math.max(...candidates.map((candidate) => candidate.blockedClears));
    if (options.requireBlock && placed.length >= 1 && maxBlocked === 0) return null;

    const preferBlocking = random() < options.blockBias;
    const pool = preferBlocking
      ? candidates.filter((candidate) => candidate.blockedClears === maxBlocked)
      : candidates;
    const chosen = pool[randomInt(random, 0, pool.length - 1)];
    if (!chosen) return null;

    placed.push({
      id: `p${placed.length + 1}`,
      path: chosen.path,
      heading: chosen.heading,
    });
  }

  return finishBoard(placed, options);
}

interface ChainPiece {
  readonly path: readonly Cell[];
  readonly heading: Heading;
}

function range(start: number, endExclusive: number): number[] {
  const values: number[] = [];
  for (let value = start; value < endExclusive; value += 1) values.push(value);
  return values;
}

function horizontalChain(
  row: number,
  heading: 'left' | 'right',
  split: boolean,
  width: number,
): ChainPiece[] {
  const bandStart = 2;
  const bandEnd = width - 3;
  const bandWidth = bandEnd - bandStart + 1;
  if (bandWidth < 2) return [];
  const segments: Array<readonly [number, number]> = [];
  if (split && bandWidth >= 4) {
    const mid = bandStart + Math.floor(bandWidth / 2) - 1;
    segments.push([bandStart, mid], [mid + 1, bandEnd]);
  } else {
    segments.push([bandStart, bandEnd]);
  }

  const pieces: ChainPiece[] = [];
  if (heading === 'right') {
    for (const [start, end] of segments) {
      const path: Cell[] = [];
      for (let x = start; x <= end; x += 1) path.push({ x, y: row });
      pieces.push({ path, heading });
    }
  } else {
    for (let index = segments.length - 1; index >= 0; index -= 1) {
      const segment = segments[index];
      if (!segment) continue;
      const [start, end] = segment;
      const path: Cell[] = [];
      for (let x = end; x >= start; x -= 1) path.push({ x, y: row });
      pieces.push({ path, heading });
    }
  }
  return pieces;
}

function verticalChain(
  x: number,
  rows: readonly number[],
  heading: 'down' | 'up',
  split: boolean,
): ChainPiece[] {
  if (rows.length < 2) return [];
  const segments: number[][] = [];
  if (split && rows.length >= 4) {
    const mid = Math.ceil(rows.length / 2);
    segments.push(rows.slice(0, mid), rows.slice(mid));
  } else {
    segments.push([...rows]);
  }

  const pieces: ChainPiece[] = [];
  for (const segment of segments) {
    const path: Cell[] = segment.map((row) => ({ x, y: row }));
    pieces.push({ path, heading });
  }
  return pieces;
}

interface ColumnCandidate {
  readonly x: number;
  readonly rows: readonly number[];
  readonly heading: 'down' | 'up';
}

function generateWeave(options: GenerateOptions): Board | null {
  const { width, height, targetPieces } = options;
  if (width < 6 || height < 4) return null;
  const random = createRandom(options.seed);

  const minK = Math.max(2, Math.floor(height / 2) - 1);
  const maxK = Math.min(height - 2, Math.ceil(height / 2) + 1);
  if (maxK < minK) return null;
  const k = randomInt(random, minK, maxK);

  const allRows = range(0, height);
  const horizontalRows =
    targetPieces < height + 2
      ? shuffle(allRows, random).slice(0, Math.max(0, targetPieces - 2)).sort((a, b) => a - b)
      : allRows;

  const baseCount = 2 + horizontalRows.length;
  const extra = targetPieces - baseCount;
  if (extra < 0) return null;

  const leftDownRows = range(0, k);
  const rightUpRows = range(k, height).reverse();
  const columns: ColumnCandidate[] = [
    { x: 0, rows: leftDownRows, heading: 'down' },
    { x: 1, rows: leftDownRows, heading: 'down' },
    { x: width - 2, rows: rightUpRows, heading: 'up' },
    { x: width - 1, rows: rightUpRows, heading: 'up' },
  ];
  const shuffledColumns = shuffle(columns, random);
  const selectedCount = Math.min(extra, shuffledColumns.length);
  const selectedColumns = shuffledColumns.slice(0, selectedCount);
  const remainingSplits = extra - selectedColumns.length;

  const splitCandidates: Array<
    | { readonly kind: 'column'; readonly x: number }
    | { readonly kind: 'row'; readonly row: number }
  > = [];
  const bandWidth = width - 4;
  if (bandWidth >= 4) {
    for (const row of horizontalRows) splitCandidates.push({ kind: 'row', row });
  }
  for (const column of selectedColumns) {
    if (column.rows.length >= 4) {
      splitCandidates.push({ kind: 'column', x: column.x });
    }
  }
  if (splitCandidates.length < remainingSplits) return null;
  const chosenSplits = shuffle(splitCandidates, random).slice(0, remainingSplits);
  const splitRows = new Set(
    chosenSplits
      .filter((split): split is { kind: 'row'; row: number } => split.kind === 'row')
      .map((split) => split.row),
  );
  const splitColumns = new Set(
    chosenSplits
      .filter((split): split is { kind: 'column'; x: number } => split.kind === 'column')
      .map((split) => split.x),
  );

  const pending: ChainPiece[] = [];

  for (const row of horizontalRows) {
    const heading = row < k ? 'right' : 'left';
    pending.push(...horizontalChain(row, heading, splitRows.has(row), width));
  }

  for (const column of selectedColumns) {
    pending.push(
      ...verticalChain(column.x, column.rows, column.heading, splitColumns.has(column.x)),
    );
  }

  // The caps are added last. Each is clear past every earlier piece, and they
  // are the only pieces clear in the final board.
  const leftCapPath: Cell[] = [];
  for (let y = k; y < height; y += 1) leftCapPath.push({ x: 1, y });
  leftCapPath.push({ x: 0, y: height - 1 });
  pending.push({ path: leftCapPath, heading: 'left' });

  const rightCapPath: Cell[] = [];
  for (let y = 0; y < k; y += 1) rightCapPath.push({ x: width - 2, y });
  rightCapPath.push({ x: width - 1, y: k - 1 });
  pending.push({ path: rightCapPath, heading: 'right' });

  const withIds: PendingPiece[] = pending.map((piece, index) => ({
    id: `p${index + 1}`,
    path: piece.path,
    heading: piece.heading,
  }));

  return finishBoard(withIds, options);
}

function assignColours(
  placed: readonly PendingPiece[],
  seed: number,
): readonly RibbonColor[] {
  const owners = new Map<string, number>();
  placed.forEach((piece, index) => {
    for (const cell of piece.path) owners.set(cellKey(cell), index);
  });

  const adjacency: Set<number>[] = placed.map(() => new Set<number>());
  for (const [key, owner] of owners) {
    const [xText, yText] = key.split(',');
    const x = Number(xText);
    const y = Number(yText);
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
    ] as const) {
      const neighbour = owners.get(`${x + dx},${y + dy}`);
      if (neighbour === undefined || neighbour === owner) continue;
      adjacency[owner]?.add(neighbour);
      adjacency[neighbour]?.add(owner);
    }
  }

  const random = createRandom(seed + 0x51ed270b);
  const colours: RibbonColor[] = [];
  const usage = new Map<RibbonColor, number>();
  for (const colour of RIBBON_COLORS) usage.set(colour, 0);

  placed.forEach((_, index) => {
    const usedByNeighbours = new Set<RibbonColor>();
    for (const neighbour of adjacency[index] ?? []) {
      const neighbourColour = colours[neighbour];
      if (neighbourColour) usedByNeighbours.add(neighbourColour);
    }
    const available = shuffle(RIBBON_COLORS, random).filter(
      (colour) => !usedByNeighbours.has(colour),
    );
    const pool = available.length > 0 ? available : [...RIBBON_COLORS];
    let chosen: RibbonColor = pool[0] ?? 'rose';
    let bestUsage = Number.POSITIVE_INFINITY;
    for (const colour of pool) {
      const count = usage.get(colour) ?? 0;
      if (count < bestUsage) {
        chosen = colour;
        bestUsage = count;
      }
    }
    colours.push(chosen);
    usage.set(chosen, (usage.get(chosen) ?? 0) + 1);
  });

  return colours;
}

function finishBoard(
  placed: readonly PendingPiece[],
  options: GenerateOptions,
): Board | null {
  if (placed.length !== options.targetPieces) return null;
  const colours = assignColours(placed, options.seed);
  const pieces: Piece[] = placed.map((piece, index) =>
    makePiece(piece, colours[index] ?? 'rose'),
  );
  const board: Board = {
    width: options.width,
    height: options.height,
    pieces,
  };

  const metrics = computeMetrics(board);
  if (
    metrics.initialClearCount < options.minClear ||
    metrics.initialClearCount > options.maxClear
  ) {
    return null;
  }

  const reverse = [...pieces].reverse().map((piece) => piece.id);
  if (!verifyRemovalOrder(board, reverse)) return null;

  return board;
}

export function generateBoard(options: GenerateOptions): Board | null {
  if (options.targetPieces < 1) return null;
  if (options.width < 2 || options.height < 2) return null;
  if (options.algorithm === 'weave') return generateWeave(options);
  if (options.minLength < 2 || options.maxLength < options.minLength) return null;
  return generateOrganic(options);
}
