import { clearanceFor } from './clearance';
import type { Board, Cell, Piece } from './types';
import { MAX_HEARTS } from './types';

export type AttemptStatus = 'idle' | 'resolving' | 'won' | 'lost';

export type Resolution =
  | {
      readonly kind: 'slide';
      readonly piece: Piece;
      readonly steps: number;
    }
  | {
      readonly kind: 'collision';
      readonly piece: Piece;
      readonly blockerId: string;
      readonly offset: number;
      readonly blockerCell: Cell;
    };

export type AttemptEvent =
  | { readonly type: 'slide'; readonly piece: Piece; readonly steps: number }
  | {
      readonly type: 'collision';
      readonly piece: Piece;
      readonly blockerId: string;
      readonly offset: number;
      readonly blockerCell: Cell;
    }
  | { readonly type: 'won'; readonly stars: number }
  | { readonly type: 'lost' };

export interface Attempt {
  readonly board: Board;
  readonly remaining: readonly Piece[];
  /** Cleared pieces in the order they left, for future reveal geometry. */
  readonly cleared: readonly Piece[];
  readonly hearts: number;
  readonly status: AttemptStatus;
  readonly resolution: Resolution | null;
  readonly pendingOutcome: 'won' | 'lost' | null;
}

export interface AttemptResult {
  readonly attempt: Attempt;
  readonly events: readonly AttemptEvent[];
}

export function startAttempt(board: Board): Attempt {
  return {
    board,
    remaining: board.pieces,
    cleared: [],
    hearts: MAX_HEARTS,
    status: 'idle',
    resolution: null,
    pendingOutcome: null,
  };
}

export function tapRibbon(attempt: Attempt, pieceId: string): AttemptResult {
  if (attempt.status !== 'idle') {
    return { attempt, events: [] };
  }

  const piece = attempt.remaining.find((candidate) => candidate.id === pieceId);
  if (!piece) return { attempt, events: [] };

  const others = attempt.remaining.filter((candidate) => candidate.id !== pieceId);
  const clearance = clearanceFor(piece, others, attempt.board.width, attempt.board.height);

  if (clearance.kind === 'blocked') {
    const hearts = Math.max(0, attempt.hearts - 1);
    const event: AttemptEvent = {
      type: 'collision',
      piece,
      blockerId: clearance.blockerId,
      offset: clearance.offset,
      blockerCell: clearance.blockerCell,
    };
    return {
      attempt: {
        ...attempt,
        hearts,
        status: 'resolving',
        resolution: {
          kind: 'collision',
          piece,
          blockerId: clearance.blockerId,
          offset: clearance.offset,
          blockerCell: clearance.blockerCell,
        },
        pendingOutcome: hearts === 0 ? 'lost' : null,
      },
      events: [event],
    };
  }

  const remaining = attempt.remaining.filter((candidate) => candidate.id !== pieceId);
  return {
    attempt: {
      ...attempt,
      remaining,
      cleared: [...attempt.cleared, piece],
      status: 'resolving',
      resolution: { kind: 'slide', piece, steps: clearance.steps },
      pendingOutcome: remaining.length === 0 ? 'won' : null,
    },
    events: [{ type: 'slide', piece, steps: clearance.steps }],
  };
}

/** Called by the renderer when the slide or lurch animation finishes. */
export function settleAttempt(attempt: Attempt): AttemptResult {
  if (attempt.status !== 'resolving' || !attempt.resolution) {
    return { attempt, events: [] };
  }

  if (attempt.pendingOutcome === 'won') {
    return {
      attempt: {
        ...attempt,
        status: 'won',
        resolution: null,
        pendingOutcome: null,
      },
      events: [{ type: 'won', stars: attempt.hearts }],
    };
  }

  if (attempt.pendingOutcome === 'lost') {
    return {
      attempt: {
        ...attempt,
        status: 'lost',
        resolution: null,
        pendingOutcome: null,
      },
      events: [{ type: 'lost' }],
    };
  }

  return {
    attempt: {
      ...attempt,
      status: 'idle',
      resolution: null,
      pendingOutcome: null,
    },
    events: [],
  };
}

export function resetAttempt(attempt: Attempt): Attempt {
  return startAttempt(attempt.board);
}

export function hintFor(attempt: Attempt): Piece | null {
  if (attempt.status !== 'idle') return null;
  for (const piece of attempt.remaining) {
    const others = attempt.remaining.filter((candidate) => candidate.id !== piece.id);
    const clearance = clearanceFor(piece, others, attempt.board.width, attempt.board.height);
    if (clearance.kind === 'clear') return piece;
  }
  return null;
}

/** Every ribbon that can slide clear right now, in board order. */
export function clearPieces(attempt: Attempt): readonly Piece[] {
  if (attempt.status !== 'idle') return [];
  return attempt.remaining.filter((piece) => {
    const others = attempt.remaining.filter((candidate) => candidate.id !== piece.id);
    return (
      clearanceFor(piece, others, attempt.board.width, attempt.board.height).kind ===
      'clear'
    );
  });
}

export function starsFor(attempt: Attempt): number {
  return attempt.status === 'won' ? attempt.hearts : 0;
}

export function clearedCount(attempt: Attempt): number {
  return attempt.cleared.length;
}

export function isBoardLocked(attempt: Attempt): boolean {
  return attempt.status !== 'idle';
}
