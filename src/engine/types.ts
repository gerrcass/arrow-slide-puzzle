/**
 * The pure rules model. No DOM, storage, clocks, or randomness lives here.
 * A piece is an ordered path of grid cells (tail → head) plus a heading.
 */

export const HEADINGS = ['up', 'right', 'down', 'left'] as const;
export type Heading = (typeof HEADINGS)[number];

export const RIBBON_COLORS = [
  'rose',
  'peach',
  'mint',
  'sky',
  'lilac',
  'butter',
  'coral',
  'aqua',
] as const;
export type RibbonColor = (typeof RIBBON_COLORS)[number];

export interface Cell {
  readonly x: number;
  readonly y: number;
}

export interface Piece {
  readonly id: string;
  /** Ordered cells from tail to head. Never repeats a cell. */
  readonly path: readonly Cell[];
  readonly heading: Heading;
  readonly color: RibbonColor;
}

export interface Board {
  readonly width: number;
  readonly height: number;
  readonly pieces: readonly Piece[];
}

export const MAX_HEARTS = 3;
