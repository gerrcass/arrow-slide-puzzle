import { describe, expect, it } from 'vitest';
import { clearanceFor } from '../engine/clearance';
import { computeMetrics } from '../engine/metrics';
import { solveBoard, verifyRemovalOrder } from '../engine/solver';
import { CHAPTER_GENERATION } from '../generator/config';
import { generateBoard } from '../generator/generate';
import { CONSTELLATIONS, constellationById } from './constellations';
import { LEVELS } from './levels';
import { metricsMatch } from './levelBuilder';
import { CHAPTERS, chapterById } from './schema';
import { campaignIssues, validateLevels } from './validate';

describe('campaign shape', () => {
  it('ships twelve levels in three chapters of four', () => {
    expect(LEVELS).toHaveLength(12);
    expect(campaignIssues(LEVELS)).toEqual([]);
    expect(new Set(LEVELS.map((level) => level.title)).size).toBe(12);
  });

  it('groups levels by their chapter and index', () => {
    for (const level of LEVELS) {
      expect(level.chapter).toBe(Math.floor(level.index / 4) + 1);
      expect(chapterById(level.chapter).id).toBe(level.chapter);
    }
    expect(CHAPTERS).toHaveLength(3);
  });

  it('references twelve distinct constellations', () => {
    expect(CONSTELLATIONS).toHaveLength(12);
    expect(new Set(CONSTELLATIONS.map((constellation) => constellation.id)).size).toBe(12);
    for (const level of LEVELS) {
      expect(constellationById(level.constellationId)).not.toBeNull();
    }
    expect(new Set(LEVELS.map((level) => level.constellationId)).size).toBe(12);
  });

  it('has usable original constellation art and copy', () => {
    for (const constellation of CONSTELLATIONS) {
      expect(constellation.name.trim().length).toBeGreaterThan(0);
      expect(constellation.caption.trim().length).toBeGreaterThan(0);
      expect(constellation.stars.length).toBeGreaterThanOrEqual(4);
      for (const star of constellation.stars) {
        expect(star.x).toBeGreaterThanOrEqual(0);
        expect(star.x).toBeLessThanOrEqual(1);
        expect(star.y).toBeGreaterThanOrEqual(0);
        expect(star.y).toBeLessThanOrEqual(1);
        expect(star.size).toBeGreaterThan(0);
      }
      for (const [from, to] of constellation.lines) {
        expect(from).toBeGreaterThanOrEqual(0);
        expect(to).toBeGreaterThanOrEqual(0);
        expect(from).toBeLessThan(constellation.stars.length);
        expect(to).toBeLessThan(constellation.stars.length);
        expect(from).not.toBe(to);
      }
    }
  });
});

describe('committed level content', () => {
  it('has no structural validation issues', () => {
    expect(validateLevels(LEVELS)).toEqual([]);
  });

  it('stays inside each chapter’s board, piece, and clear bands', () => {
    for (const level of LEVELS) {
      const chapter = chapterById(level.chapter);
      const metrics = computeMetrics(level.board);
      expect(level.board.width).toBe(chapter.width);
      expect(level.board.height).toBe(chapter.height);
      expect(metrics.pieceCount).toBeGreaterThanOrEqual(chapter.minPieces);
      expect(metrics.pieceCount).toBeLessThanOrEqual(chapter.maxPieces);
      expect(metrics.initialClearCount).toBeGreaterThanOrEqual(chapter.minClear);
      expect(metrics.initialClearCount).toBeLessThanOrEqual(chapter.maxClear);
    }
  });

  it('stores metrics that match the board', () => {
    for (const level of LEVELS) {
      expect(metricsMatch(level.metrics, computeMetrics(level.board))).toBe(true);
    }
  });

  it('every level is solver-verified and the reverse construction order clears it', () => {
    for (const level of LEVELS) {
      const order = solveBoard(level.board);
      expect(order, `level ${level.index + 1} should be solvable`).not.toBeNull();
      expect(order).toHaveLength(level.board.pieces.length);

      const reverse = [...level.board.pieces].reverse().map((piece) => piece.id);
      expect(
        verifyRemovalOrder(level.board, reverse),
        `level ${level.index + 1} should clear in reverse construction order`,
      ).toBe(true);
    }
  });

  it('has no dead ends: a clear ribbon never becomes blocked after another clear', () => {
    for (const level of LEVELS) {
      const pieces = level.board.pieces;
      const initiallyClear = pieces.filter((piece) => {
        const others = pieces.filter((candidate) => candidate.id !== piece.id);
        return clearanceFor(piece, others, level.board.width, level.board.height).kind === 'clear';
      });

      for (const removed of initiallyClear) {
        const remaining = pieces.filter((piece) => piece.id !== removed.id);
        for (const piece of remaining) {
          if (!initiallyClear.some((candidate) => candidate.id === piece.id)) continue;
          const others = remaining.filter((candidate) => candidate.id !== piece.id);
          expect(
            clearanceFor(piece, others, level.board.width, level.board.height).kind,
            `level ${level.index + 1}: ${piece.id} lost clearance after ${removed.id}`,
          ).toBe('clear');
        }
      }
    }
  });

  it('regenerates every committed board from its seed', () => {
    for (const level of LEVELS) {
      const profile = CHAPTER_GENERATION[level.chapter];
      const board = generateBoard({
        ...profile,
        seed: level.seed,
        width: level.board.width,
        height: level.board.height,
        targetPieces: level.board.pieces.length,
      });
      expect(board, `level ${level.index + 1} should regenerate`).not.toBeNull();
      expect(board).toEqual(level.board);
    }
  });

  it('keeps the campaign difficulty metrics readable', () => {
    const pieceCounts = LEVELS.map((level) => level.metrics.pieceCount);
    expect(pieceCounts).toEqual([6, 7, 8, 9, 9, 10, 11, 12, 12, 13, 15, 16]);
    expect(LEVELS.map((level) => level.metrics.initialClearCount)).toEqual([
      4, 3, 4, 4, 3, 3, 3, 3, 2, 2, 2, 2,
    ]);
  });
});
