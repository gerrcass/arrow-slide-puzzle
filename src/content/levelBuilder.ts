import { computeMetrics, type LevelMetrics } from '../engine/metrics';
import type { Board } from '../engine/types';
import { chapterFor, type Level } from './schema';

export function metricsMatch(a: LevelMetrics, b: LevelMetrics): boolean {
  return (
    a.pieceCount === b.pieceCount &&
    a.initialClearCount === b.initialClearCount &&
    a.totalCells === b.totalCells &&
    a.density === b.density &&
    a.averageLength === b.averageLength &&
    a.longestPiece === b.longestPiece &&
    a.bendCount === b.bendCount &&
    a.straightPieces === b.straightPieces &&
    a.blockedAtFirstOffset === b.blockedAtFirstOffset &&
    a.lateBlocked === b.lateBlocked &&
    a.nonObviousCount === b.nonObviousCount
  );
}

export function boardWithMetrics(board: Board): {
  readonly board: Board;
  readonly metrics: LevelMetrics;
} {
  return { board, metrics: computeMetrics(board) };
}

export function makeLevel(
  index: number,
  title: string,
  constellationId: string,
  seed: number,
  board: Board,
): Level {
  return {
    index,
    chapter: chapterFor(index).id,
    title,
    constellationId,
    seed,
    board,
    metrics: computeMetrics(board),
  };
}
