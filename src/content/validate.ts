import { clearanceFor } from '../engine/clearance';
import { cellKey, validatePieceGeometry } from '../engine/geometry';
import { computeMetrics } from '../engine/metrics';
import { RIBBON_COLORS } from '../engine/types';
import { constellationById } from './constellations';
import { metricsMatch } from './levelBuilder';
import { CHAPTERS, type ChapterNumber, type Level } from './schema';

export interface ContentIssue {
  readonly levelIndex: number;
  readonly message: string;
}

function checkChapter(
  level: Level,
  issues: ContentIssue[],
): void {
  const chapter = CHAPTERS.find((candidate) => candidate.id === level.chapter);
  if (!chapter) {
    issues.push({ levelIndex: level.index, message: `Unknown chapter ${level.chapter}` });
    return;
  }
  if (level.board.width !== chapter.width || level.board.height !== chapter.height) {
    issues.push({
      levelIndex: level.index,
      message: `Board is ${level.board.width}×${level.board.height}, chapter expects ${chapter.width}×${chapter.height}`,
    });
  }
  const count = level.board.pieces.length;
  if (count < chapter.minPieces || count > chapter.maxPieces) {
    issues.push({
      levelIndex: level.index,
      message: `${count} pieces is outside chapter band ${chapter.minPieces}–${chapter.maxPieces}`,
    });
  }
  const clearCount = level.metrics.initialClearCount;
  if (clearCount < chapter.minClear || clearCount > chapter.maxClear) {
    issues.push({
      levelIndex: level.index,
      message: `${clearCount} initially clear pieces is outside chapter band ${chapter.minClear}–${chapter.maxClear}`,
    });
  }
  if (Math.floor(level.index / 4) + 1 !== chapter.id) {
    issues.push({
      levelIndex: level.index,
      message: `Level index ${level.index} does not belong to chapter ${chapter.id}`,
    });
  }
}

export function validateLevels(levels: readonly Level[]): readonly ContentIssue[] {
  const issues: ContentIssue[] = [];

  levels.forEach((level, arrayIndex) => {
    const seenIds = new Set<string>();
    if (level.index !== arrayIndex) {
      issues.push({
        levelIndex: arrayIndex,
        message: `Level index ${level.index} does not match array position ${arrayIndex}`,
      });
    }
    if (!Number.isInteger(level.seed) || level.seed < 0) {
      issues.push({ levelIndex: level.index, message: 'Seed must be a non-negative integer' });
    }
    if (level.title.trim().length === 0) {
      issues.push({ levelIndex: level.index, message: 'Title is empty' });
    }
    if (!constellationById(level.constellationId)) {
      issues.push({
        levelIndex: level.index,
        message: `Unknown constellation ${level.constellationId}`,
      });
    }

    checkChapter(level, issues);

    const occupancy = new Map<string, string>();
    for (const piece of level.board.pieces) {
      if (seenIds.has(piece.id)) {
        issues.push({ levelIndex: level.index, message: `Duplicate piece id ${piece.id}` });
      }
      seenIds.add(piece.id);
      if (!RIBBON_COLORS.includes(piece.color)) {
        issues.push({
          levelIndex: level.index,
          message: `Piece ${piece.id} has unknown colour ${String(piece.color)}`,
        });
      }
      for (const issue of validatePieceGeometry(piece, level.board.width, level.board.height)) {
        issues.push({ levelIndex: level.index, message: `Piece ${piece.id}: ${issue.kind}` });
      }
      for (const cell of piece.path) {
        const key = cellKey(cell);
        const previous = occupancy.get(key);
        if (previous) {
          issues.push({
            levelIndex: level.index,
            message: `Pieces ${previous} and ${piece.id} share cell ${key}`,
          });
        } else {
          occupancy.set(key, piece.id);
        }
      }
    }

    const recomputed = computeMetrics(level.board);
    if (!metricsMatch(level.metrics, recomputed)) {
      issues.push({
        levelIndex: level.index,
        message: 'Stored metrics do not match the board',
      });
    }

    for (const piece of level.board.pieces) {
      const others = level.board.pieces.filter((candidate) => candidate.id !== piece.id);
      const clearance = clearanceFor(piece, others, level.board.width, level.board.height);
      if (clearance.kind === 'blocked' && clearance.blockerId === piece.id) {
        issues.push({
          levelIndex: level.index,
          message: `Piece ${piece.id} blocks itself`,
        });
      }
    }
  });

  return issues;
}

export function assertValidLevels(levels: readonly Level[]): void {
  const issues = validateLevels(levels);
  if (issues.length > 0) {
    const summary = issues
      .map((issue) => `[level ${issue.levelIndex}] ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid level content:\n${summary}`);
  }
}

export function campaignIssues(levels: readonly Level[]): readonly ContentIssue[] {
  const issues: ContentIssue[] = [];
  if (levels.length !== 12) {
    issues.push({ levelIndex: 0, message: `Campaign has ${levels.length} levels, expected 12` });
  }
  for (const chapter of CHAPTERS) {
    const count = levels.filter((level) => level.chapter === chapter.id).length;
    if (count !== 4) {
      const chapterNumber: ChapterNumber = chapter.id;
      issues.push({
        levelIndex: (chapterNumber - 1) * 4,
        message: `Chapter ${chapter.id} has ${count} levels, expected 4`,
      });
    }
  }
  return issues;
}
