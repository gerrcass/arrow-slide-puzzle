import type { Constellation } from '../../content/schema';
import { clearanceFor } from '../../engine/clearance';
import { HEADING_VECTORS } from '../../engine/geometry';
import type { Attempt, Resolution } from '../../engine/session';
import type { Board, Piece, RibbonColor } from '../../engine/types';
import { createBoardArt, describePiece } from './boardSvg';
import { el, svgEl } from './dom';
import { revealDuration, revealHoleFor } from './reveal';

export interface BoardViewOptions {
  readonly accent?: RibbonColor;
  readonly describedBy?: string;
  readonly constellation?: Constellation | undefined;
  readonly assistive?: boolean;
  readonly onActivate: (pieceId: string) => void;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export class BoardView {
  readonly element: HTMLDivElement;

  private readonly svg: SVGSVGElement;
  private readonly groups: Map<string, SVGGElement>;
  private readonly frost: SVGGElement | null;
  private readonly holes: SVGGElement | null;
  private readonly constellationArt: SVGSVGElement | null;
  private readonly constellationLines: readonly SVGLineElement[];
  private readonly constellationStars: readonly SVGCircleElement[];
  private readonly revealed = new Set<string>();
  private readonly board: Board;
  private readonly onActivate: (pieceId: string) => void;
  private readonly abort = new AbortController();
  private readonly timers = new Set<number>();
  private readonly animations = new Set<Animation>();
  private locked = false;
  private destroyed = false;
  private revealComplete = false;
  private assistive: boolean;
  private lastAttempt: Attempt | null = null;

  constructor(board: Board, options: BoardViewOptions) {
    this.board = board;
    this.onActivate = options.onActivate;
    this.assistive = options.assistive ?? false;
    const art = createBoardArt(board, {
      interactive: true,
      accent: options.accent ?? 'rose',
      className: 'board-svg--play',
      constellation: options.constellation,
    });
    this.svg = art.svg;
    this.groups = new Map(art.groups);
    this.frost = art.frost;
    this.holes = art.holes;
    this.constellationArt = art.constellation?.querySelector<SVGSVGElement>(
      '.constellation--board',
    ) ?? null;
    this.constellationLines = [
      ...art.svg.querySelectorAll<SVGLineElement>('.constellation-lines line'),
    ];
    this.constellationStars = [
      ...art.svg.querySelectorAll<SVGCircleElement>('.constellation-star'),
    ];

    if (options.describedBy) {
      this.svg.setAttribute('aria-describedby', options.describedBy);
    }

    this.element = el('div', 'board-frame');
    const inner = el('div', 'board-view');
    inner.append(this.svg);
    this.element.append(inner);

    for (const [id, group] of this.groups) {
      group.addEventListener(
        'click',
        () => {
          if (!this.locked) this.onActivate(id);
        },
        { signal: this.abort.signal },
      );
      group.addEventListener(
        'keydown',
        (event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          if (event.repeat || event.isComposing) return;
          if (!this.locked) this.onActivate(id);
        },
        { signal: this.abort.signal },
      );
    }
  }

  render(attempt: Attempt): void {
    if (this.destroyed) return;
    this.lastAttempt = attempt;
    const remaining = new Set(attempt.remaining.map((piece) => piece.id));
    for (const piece of this.board.pieces) {
      const group = this.groups.get(piece.id);
      if (!group) continue;
      if (remaining.has(piece.id)) {
        if (group.style.display === 'none') {
          for (const animation of group.getAnimations()) animation.cancel();
          group.style.display = '';
          group.style.transform = '';
          group.style.opacity = '';
          group.classList.remove('is-sliding', 'is-hinted', 'is-blocker', 'is-colliding');
        }
        group.setAttribute('aria-disabled', attempt.status === 'idle' ? 'false' : 'true');
      } else {
        group.style.display = 'none';
      }
    }

    this.updateLabels(attempt.remaining);
    this.setLocked(attempt.status !== 'idle');
  }

  /** Toggling assistive mode updates names without disturbing the board. */
  setAssistive(assistive: boolean): void {
    if (this.assistive === assistive) return;
    this.assistive = assistive;
    this.updateLabels(this.lastAttempt?.remaining ?? this.board.pieces);
  }

  private updateLabels(remaining: readonly Piece[]): void {
    for (const piece of remaining) {
      const group = this.groups.get(piece.id);
      if (!group) continue;
      let state: 'clear' | 'blocked' | null = null;
      if (this.assistive) {
        const others = remaining.filter((candidate) => candidate.id !== piece.id);
        state =
          clearanceFor(piece, others, this.board.width, this.board.height).kind ===
          'clear'
            ? 'clear'
            : 'blocked';
      }
      group.setAttribute('aria-label', describePiece(piece, state));
    }
  }

  setLocked(locked: boolean): void {
    if (this.destroyed) return;
    this.locked = locked;
    this.element.classList.toggle('is-locked', locked);
    this.svg.setAttribute('aria-busy', locked ? 'true' : 'false');
    for (const group of this.groups.values()) {
      group.setAttribute('aria-disabled', locked ? 'true' : 'false');
    }
  }

  async animateResolution(resolution: Resolution, reduced: boolean): Promise<void> {
    if (this.destroyed) return;
    if (resolution.kind === 'slide') {
      await this.animateSlide(resolution, reduced);
    } else {
      await this.animateCollision(resolution, reduced);
    }
  }

  pulseHint(pieceId: string): void {
    const group = this.groups.get(pieceId);
    if (!group) return;
    group.classList.add('is-hinted');
    this.schedule(() => group.classList.remove('is-hinted'), 1500);
  }

  /**
   * Opens a frost hole along the exact cells the ribbon vacated. The reveal is
   * started with the slide, so it reads as the ribbon peeling the frost back.
   */
  async punchReveal(piece: Piece, reduced: boolean): Promise<void> {
    if (this.destroyed || !this.holes || this.revealed.has(piece.id)) return;
    this.revealed.add(piece.id);

    const hole = revealHoleFor(piece, reduced);
    const node = svgEl('path', {
      class: 'frost-hole',
      d: hole.d,
      fill: 'none',
      stroke: '#000000',
      'stroke-width': String(hole.strokeWidth),
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      pathLength: '1',
      'stroke-dasharray': '1',
      'stroke-dashoffset': reduced ? '0' : '1',
      'data-piece-id': piece.id,
    });
    this.holes.append(node);

    if (reduced || revealDuration(reduced) === 0) {
      node.setAttribute('stroke-dashoffset', '0');
      return;
    }

    const animation = node.animate(
      [
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0 },
      ],
      {
        duration: hole.durationMs,
        delay: 140,
        easing: 'cubic-bezier(0.33, 0.8, 0.4, 1)',
        fill: 'forwards',
      },
    );
    await this.finished(animation);
    if (this.destroyed) return;
    node.setAttribute('stroke-dashoffset', '0');
  }

  /** Retry/restart returns the frost to its untouched state. */
  resetReveals(): void {
    if (this.destroyed) return;
    this.revealed.clear();
    this.revealComplete = false;
    this.holes?.replaceChildren();
    for (const node of [this.frost, this.holes, this.constellationArt]) {
      if (!node) continue;
      for (const animation of node.getAnimations({ subtree: true })) {
        try {
          animation.cancel();
        } catch {
          // Already finished.
        }
      }
    }
    if (this.frost) {
      this.frost.style.display = '';
      this.frost.style.opacity = '';
    }
    this.constellationArt?.classList.remove('is-revealed');
    for (const line of this.constellationLines) {
      line.style.removeProperty('stroke-dasharray');
      line.style.removeProperty('stroke-dashoffset');
    }
    for (const star of this.constellationStars) {
      star.style.removeProperty('opacity');
    }
  }

  /**
   * The win sequence: remaining frost dissolves, the line work draws itself,
   * then the stars settle in. Reduced motion keeps the completed art and skips
   * the long sequence.
   */
  async revealBoard(reduced: boolean): Promise<void> {
    if (this.destroyed || this.revealComplete) return;
    this.revealComplete = true;

    if (!this.frost || !this.constellationArt) {
      this.frost?.style.setProperty('display', 'none');
      return;
    }

    if (reduced) {
      this.frost.style.display = 'none';
      this.constellationArt.classList.add('is-revealed');
      for (const line of this.constellationLines) {
        line.style.removeProperty('stroke-dasharray');
        line.style.removeProperty('stroke-dashoffset');
      }
      for (const star of this.constellationStars) {
        star.style.removeProperty('opacity');
      }
      return;
    }

    this.element.classList.add('is-revealing');
    const frostAnimation = this.frost.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 620, easing: 'ease-out', fill: 'forwards' },
    );
    this.animations.add(frostAnimation);

    const lineAnimations = this.constellationLines.map((line, index) => {
      let length = 0;
      try {
        length = line.getTotalLength();
      } catch {
        length = 10;
      }
      line.style.strokeDasharray = String(length);
      line.style.strokeDashoffset = String(length);
      const animation = line.animate(
        [
          { strokeDashoffset: length },
          { strokeDashoffset: 0 },
        ],
        {
          duration: 420,
          delay: 640 + index * 30,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          fill: 'forwards',
        },
      );
      this.animations.add(animation);
      return animation;
    });

    const starAnimations = this.constellationStars.map((star, index) => {
      star.style.opacity = '0';
      const animation = star.animate(
        [
          { opacity: 0 },
          { opacity: 1, offset: 0.42 },
          { opacity: 0.62, offset: 0.7 },
          { opacity: 1 },
        ],
        {
          duration: 780,
          delay: 1000 + index * 20,
          easing: 'ease-in-out',
          fill: 'forwards',
        },
      );
      this.animations.add(animation);
      return animation;
    });

    await Promise.all(
      [frostAnimation, ...lineAnimations, ...starAnimations].map((animation) =>
        this.finished(animation),
      ),
    );

    if (this.destroyed) return;
    this.element.classList.remove('is-revealing');
    this.frost.style.display = 'none';
    this.constellationArt.classList.add('is-revealed');
    for (const line of this.constellationLines) {
      line.style.removeProperty('stroke-dasharray');
      line.style.removeProperty('stroke-dashoffset');
    }
    for (const star of this.constellationStars) {
      star.style.opacity = '1';
    }
  }

  focusNextAfter(pieceId: string): void {
    const order = this.board.pieces.map((piece) => piece.id);
    const start = order.indexOf(pieceId);
    if (start < 0) return;
    for (let step = 1; step <= order.length; step += 1) {
      const candidateId = order[(start + step) % order.length];
      if (!candidateId) continue;
      const group = this.groups.get(candidateId);
      if (group && group.style.display !== 'none') {
        group.focus();
        return;
      }
    }
  }

  focusFirst(): void {
    for (const piece of this.board.pieces) {
      const group = this.groups.get(piece.id);
      if (group && group.style.display !== 'none') {
        group.focus();
        return;
      }
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.abort.abort();
    for (const animation of this.animations) {
      try {
        animation.cancel();
      } catch {
        // The animation may already have finished.
      }
    }
    this.animations.clear();
    for (const timer of this.timers) window.clearTimeout(timer);
    this.timers.clear();
    this.element.remove();
  }

  private async animateSlide(
    resolution: Extract<Resolution, { kind: 'slide' }>,
    reduced: boolean,
  ): Promise<void> {
    const group = this.groups.get(resolution.piece.id);
    if (!group) return;
    const reveal = this.punchReveal(resolution.piece, reduced);

    if (reduced) {
      const animation = group.animate(
        [
          { opacity: 1 },
          { opacity: 0 },
        ],
        { duration: 90, easing: 'ease-out', fill: 'forwards' },
      );
      await Promise.all([this.finished(animation), reveal]);
      group.style.display = 'none';
      for (const active of group.getAnimations()) active.cancel();
      return;
    }

    const vector = HEADING_VECTORS[resolution.piece.heading];
    const distance = resolution.steps + 0.7;
    const dx = vector.x * distance;
    const dy = vector.y * distance;
    const duration = 380 + Math.min(resolution.steps, 8) * 30;

    group.classList.add('is-sliding');
    const animation = group.animate(
      [
        { transform: 'translate(0px, 0px)', opacity: 1, offset: 0 },
        {
          transform: `translate(${(dx * 0.28).toFixed(3)}px, ${(dy * 0.28).toFixed(3)}px)`,
          opacity: 1,
          offset: 0.34,
        },
        {
          transform: `translate(${(dx * 0.86).toFixed(3)}px, ${(dy * 0.86).toFixed(3)}px)`,
          opacity: 0.92,
          offset: 0.82,
        },
        {
          transform: `translate(${dx.toFixed(3)}px, ${dy.toFixed(3)}px)`,
          opacity: 0,
          offset: 1,
        },
      ],
      {
        duration,
        easing: 'cubic-bezier(0.45, 0, 0.72, 0.42)',
        fill: 'forwards',
      },
    );
    await this.finished(animation);
    await reveal;
    group.style.display = 'none';
    for (const active of group.getAnimations()) active.cancel();
  }

  private async animateCollision(
    resolution: Extract<Resolution, { kind: 'collision' }>,
    reduced: boolean,
  ): Promise<void> {
    const group = this.groups.get(resolution.piece.id);
    const blocker = this.groups.get(resolution.blockerId);
    if (!group) return;

    if (blocker) {
      blocker.classList.add('is-blocker');
      this.schedule(() => blocker.classList.remove('is-blocker'), 560);
    }

    if (reduced) {
      group.classList.add('is-bumped');
      this.schedule(() => group.classList.remove('is-bumped'), 210);
      await wait(150);
      return;
    }

    const vector = HEADING_VECTORS[resolution.piece.heading];
    const lurch = Math.min(0.13 + (resolution.offset - 1) * 0.07, 0.46);
    const dx = vector.x * lurch;
    const dy = vector.y * lurch;

    this.element.classList.add('is-shaking');
    this.schedule(() => this.element.classList.remove('is-shaking'), 440);

    const animation = group.animate(
      [
        { transform: 'translate(0px, 0px)', offset: 0 },
        {
          transform: `translate(${dx.toFixed(3)}px, ${dy.toFixed(3)}px)`,
          offset: 0.32,
        },
        {
          transform: `translate(${(dx * -0.18).toFixed(3)}px, ${(dy * -0.18).toFixed(3)}px)`,
          offset: 0.62,
        },
        { transform: 'translate(0px, 0px)', offset: 1 },
      ],
      {
        duration: 360,
        easing: 'cubic-bezier(0.22, 0.9, 0.34, 1)',
      },
    );
    await this.finished(animation);
  }

  private async finished(animation: Animation): Promise<void> {
    this.animations.add(animation);
    try {
      await animation.finished;
    } catch {
      // Cancellation during teardown is not an error.
    } finally {
      this.animations.delete(animation);
    }
  }

  private schedule(callback: () => void, ms: number): void {
    const timer = window.setTimeout(() => {
      this.timers.delete(timer);
      if (!this.destroyed) callback();
    }, ms);
    this.timers.add(timer);
  }
}
