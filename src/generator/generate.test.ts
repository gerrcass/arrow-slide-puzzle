import { describe, expect, it } from 'vitest';
import { cellKey, validatePieceGeometry } from '../engine/geometry';
import { computeMetrics } from '../engine/metrics';
import { solveBoard, verifyRemovalOrder } from '../engine/solver';
import type { Board } from '../engine/types';
import { CHAPTER_GENERATION } from './config';
import { generateBoard, type GenerateOptions } from './generate';

function expectValidBoard(board: Board | null): Board {
  expect(board).not.toBeNull();
  if (!board) throw new Error('unreachable');
  const occupancy = new Set<string>();
  for (const piece of board.pieces) {
    expect(validatePieceGeometry(piece, board.width, board.height)).toEqual([]);
    for (const cell of piece.path) {
      const key = cellKey(cell);
      expect(occupancy.has(key), `shared cell ${key}`).toBe(false);
      occupancy.add(key);
    }
  }
  expect(solveBoard(board)).not.toBeNull();
  const reverse = [...board.pieces].reverse().map((piece) => piece.id);
  expect(verifyRemovalOrder(board, reverse)).toBe(true);
  return board;
}

function organicOptions(overrides: Partial<GenerateOptions> = {}): GenerateOptions {
  return {
    ...CHAPTER_GENERATION[1],
    seed: 10600,
    width: 6,
    height: 6,
    targetPieces: 6,
    ...overrides,
  };
}

function weaveOptions(overrides: Partial<GenerateOptions> = {}): GenerateOptions {
  return {
    ...CHAPTER_GENERATION[3],
    seed: 912000,
    width: 8,
    height: 8,
    targetPieces: 12,
    ...overrides,
  };
}

describe('seeded generator', () => {
  it('is deterministic for the same seed and options', () => {
    const first = generateBoard(organicOptions());
    const second = generateBoard(organicOptions());
    expect(first).not.toBeNull();
    expect(second).toEqual(first);
  });

  it('produces different tangles for different seeds', () => {
    const first = generateBoard(organicOptions({ seed: 10600 }));
    const second = generateBoard(organicOptions({ seed: 10601 }));
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(second).not.toEqual(first);
  });

  it('every organic board it accepts is solver-verified and in band', () => {
    let accepted = 0;
    for (let index = 0; index < 40; index += 1) {
      const options = organicOptions({ seed: 10600 + index });
      const board = generateBoard(options);
      if (!board) continue;
      accepted += 1;
      expectValidBoard(board);
      const metrics = computeMetrics(board);
      expect(metrics.pieceCount).toBe(options.targetPieces);
      expect(metrics.initialClearCount).toBeGreaterThanOrEqual(options.minClear);
      expect(metrics.initialClearCount).toBeLessThanOrEqual(options.maxClear);
    }
    expect(accepted).toBeGreaterThan(0);
  });

  it('builds a chapter-three weave with exactly two clear ribbons', () => {
    for (const targetPieces of [12, 13, 15, 16]) {
      const board = expectValidBoard(
        generateBoard(weaveOptions({ targetPieces, seed: 900000 + targetPieces * 1000 })),
      );
      const metrics = computeMetrics(board);
      expect(metrics.pieceCount).toBe(targetPieces);
      expect(metrics.initialClearCount).toBe(2);
      expect(metrics.pieceCount).toBeGreaterThanOrEqual(12);
      expect(metrics.pieceCount).toBeLessThanOrEqual(16);
    }
  });

  it('is deterministic for the weave as well', () => {
    const first = generateBoard(weaveOptions());
    const second = generateBoard(weaveOptions());
    expect(first).not.toBeNull();
    expect(second).toEqual(first);
  });

  it('changes the weave when the seed changes', () => {
    const first = generateBoard(weaveOptions({ seed: 912000 }));
    const second = generateBoard(weaveOptions({ seed: 912001 }));
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(second).not.toEqual(first);
  });

  it('rejects impossible or invalid options', () => {
    expect(generateBoard(organicOptions({ targetPieces: 0 }))).toBeNull();
    expect(generateBoard(organicOptions({ width: 1, height: 1 }))).toBeNull();
    expect(
      generateBoard(organicOptions({ minLength: 1, maxLength: 1 })),
    ).toBeNull();
    expect(generateBoard(weaveOptions({ width: 5 }))).toBeNull();
  });

  it('uses no ambient randomness', () => {
    const originalRandom = Math.random;
    Math.random = () => {
      throw new Error('Math.random must not be used');
    };
    try {
      expect(generateBoard(organicOptions())).not.toBeNull();
      expect(generateBoard(weaveOptions())).not.toBeNull();
    } finally {
      Math.random = originalRandom;
    }
  });
});
