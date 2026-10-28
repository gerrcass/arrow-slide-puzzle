import { constellationById } from '../../content/constellations';
import { LEVELS } from '../../content/levels';
import { chapterFor, type Level } from '../../content/schema';
import {
  clearedCount,
  hintFor,
  resetAttempt,
  settleAttempt,
  startAttempt,
  tapRibbon,
  type Attempt,
} from '../../engine/session';
import type { AppContext, Screen } from '../context';
import { BoardView } from '../ui/boardView';
import { createConstellationArt } from '../ui/constellation';
import {
  append,
  el,
} from '../ui/dom';
import { createIcon } from '../ui/icons';
import {
  openDialog,
  type DialogAction,
  type DialogHandle,
} from '../ui/dialog';
import { ribbonColourName } from '../ui/ribbonPalette';
import { createHeartRow, createStarRow } from '../ui/stars';

let instructionsCounter = 0;

function plural(count: number, singular: string, pluralWord = `${singular}s`): string {
  return count === 1 ? singular : pluralWord;
}

export function playScreen(context: AppContext, level: Level): Screen {
  instructionsCounter += 1;
  const instructionsId = `play-instructions-${instructionsCounter}`;
  const chapter = chapterFor(level.index);
  const constellation = constellationById(level.constellationId);
  const total = level.board.pieces.length;

  let attempt: Attempt = startAttempt(level.board);
  let disposed = false;
  let activeDialog: DialogHandle | null = null;
  const timers = new Set<number>();
  let heartTimer: number | null = null;

  const screen = el('main', 'screen play-screen');

  const header = el('header', 'play-header');
  const back = el('button', 'icon-button play-back');
  back.type = 'button';
  back.setAttribute('aria-label', 'Back to the title');
  back.append(createIcon('arrow-left'));
  back.addEventListener('click', () => context.navigate('#/'));

  const headingBlock = el('div', 'play-heading');
  const eyebrow = el(
    'p',
    'eyebrow',
    `Chapter ${chapter.numeral} · ${chapter.title}`,
  );
  const heading = el('h1', 'play-title', level.title);
  heading.tabIndex = -1;
  heading.setAttribute('data-screen-heading', '');
  append(headingBlock, eyebrow, heading);

  const tanglePill = el('span', 'pill play-tangle-pill');
  tanglePill.append(
    createIcon('sparkle', 'icon icon--sm'),
    `Tangle ${String(level.index + 1).padStart(2, '0')}`,
  );

  append(header, back, headingBlock, tanglePill);

  const status = el('div', 'play-status');
  const hearts = createHeartRow(attempt.hearts);
  const progressPill = el('div', 'progress-pill');
  const progressLabel = el('span', 'progress-pill__label');
  const progressTrack = el('div', 'progress-track');
  progressTrack.setAttribute('role', 'progressbar');
  progressTrack.setAttribute('aria-label', 'Ribbons cleared');
  progressTrack.setAttribute('aria-valuemin', '0');
  progressTrack.setAttribute('aria-valuemax', String(total));
  const progressFill = el('span', 'progress-track__fill');
  progressTrack.append(progressFill);
  append(progressPill, progressLabel, progressTrack);

  const constellationPill = el('span', 'pill constellation-pill');
  constellationPill.append(
    createIcon('star', 'icon icon--sm'),
    'A constellation waits',
  );

  append(status, hearts, progressPill, constellationPill);

  const instructions = el(
    'p',
    'visually-hidden',
    'Each ribbon is a button. Activate a ribbon that can slide all the way off the board. A blocked ribbon costs one heart. Press H for a hint and R to reset.',
  );
  instructions.id = instructionsId;

  const stage = el('div', 'board-stage');
  const boardView = new BoardView(level.board, {
    seed: level.seed,
    accent: chapter.accent,
    describedBy: instructionsId,
    onActivate: (pieceId) => handleTap(pieceId),
  });
  stage.append(boardView.element);

  const footer = el('footer', 'play-footer');
  const actions = el('div', 'play-actions');
  const hintButton = el('button', 'btn btn--secondary');
  hintButton.type = 'button';
  hintButton.append(createIcon('hint'), 'Hint');
  hintButton.addEventListener('click', showHint);

  const resetButton = el('button', 'btn btn--ghost');
  resetButton.type = 'button';
  resetButton.append(createIcon('reset'), 'Reset');
  resetButton.addEventListener('click', requestReset);
  append(actions, hintButton, resetButton);

  const keyHint = el('p', 'key-hint');
  keyHint.append(el('kbd', 'key', 'H'), ' hint', el('span', 'key-hint__dot', '·'), el('kbd', 'key', 'R'), ' reset');
  append(footer, actions, keyHint);

  append(screen, header, status, instructions, stage, footer);
  document.title = `${level.title} · Nana Pearl’s Arrow Slide Puzzle`;

  boardView.render(attempt);
  renderHud();
  updateControls();

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (document.querySelector('dialog[open]')) return;
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT')
    ) {
      return;
    }
    const key = event.key.toLowerCase();
    if (key === 'h') {
      event.preventDefault();
      showHint();
    } else if (key === 'r') {
      event.preventDefault();
      requestReset();
    }
  };
  window.addEventListener('keydown', onKeyDown);

  function renderHud(): void {
    const slots = hearts.querySelectorAll<HTMLElement>('.heart-slot');
    slots.forEach((slot, index) => {
      slot.classList.toggle('is-full', index < attempt.hearts);
      slot.classList.toggle('is-empty', index >= attempt.hearts);
    });
    hearts.setAttribute(
      'aria-label',
      `${attempt.hearts} of 3 hearts remaining`,
    );

    const cleared = clearedCount(attempt);
    progressLabel.textContent = `${cleared} / ${total} cleared`;
    progressTrack.setAttribute('aria-valuenow', String(cleared));
    progressFill.style.width = `${total === 0 ? 0 : (cleared / total) * 100}%`;
  }

  function updateControls(): void {
    const idle = attempt.status === 'idle';
    hintButton.disabled = !idle || hintFor(attempt) === null;
    resetButton.disabled = !idle;
  }

  function breakHeart(): void {
    hearts.classList.remove('is-breaking');
    void hearts.offsetWidth;
    hearts.classList.add('is-breaking');
    if (heartTimer !== null) window.clearTimeout(heartTimer);
    heartTimer = window.setTimeout(() => {
      hearts.classList.remove('is-breaking');
      heartTimer = null;
    }, 620);
  }

  function handleTap(pieceId: string): void {
    if (disposed || attempt.status !== 'idle') return;
    const focusedRibbon = document.activeElement;
    const wasFocused =
      focusedRibbon instanceof Element &&
      focusedRibbon.closest('.ribbon')?.getAttribute('data-piece-id') === pieceId;

    const result = tapRibbon(attempt, pieceId);
    if (result.attempt === attempt) return;

    const previousHearts = attempt.hearts;
    attempt = result.attempt;
    renderHud();
    updateControls();
    boardView.setLocked(true);

    const resolution = attempt.resolution;
    if (!resolution) return;

    const reduced = context.isReducedMotion();

    if (resolution.kind === 'collision') {
      const blocker = attempt.remaining.find((piece) => piece.id === resolution.blockerId);
      const blockerName = blocker ? ribbonColourName(blocker.color) : 'another';
      const heartsLeft = attempt.hearts;
      context.announce(
        `Blocked by the ${blockerName} ribbon. ${heartsLeft} ${plural(heartsLeft, 'heart')} left.`,
        'assertive',
      );
      if (previousHearts > attempt.hearts) breakHeart();
    } else {
      context.announce(
        `Cleared the ${ribbonColourName(resolution.piece.color)} ribbon. ${attempt.cleared.length} of ${total} cleared.`,
      );
    }

    void boardView
      .animateResolution(resolution, reduced)
      .then(() => afterResolution(wasFocused, resolution.kind === 'slide' ? pieceId : null))
      .catch(() => {
        // A cancelled animation during navigation is not a game error.
      });
  }

  function afterResolution(wasFocused: boolean, clearedId: string | null): void {
    if (disposed) return;
    const settled = settleAttempt(attempt);
    attempt = settled.attempt;
    boardView.render(attempt);
    boardView.setLocked(false);
    renderHud();
    updateControls();

    if (wasFocused && clearedId) boardView.focusNextAfter(clearedId);

    for (const event of settled.events) {
      if (event.type === 'won') {
        showWin(event.stars);
        return;
      }
      if (event.type === 'lost') {
        showLoss();
        return;
      }
    }
  }

  function showHint(): void {
    if (disposed || attempt.status !== 'idle') return;
    const piece = hintFor(attempt);
    if (!piece) {
      context.announce('No ribbon is clear. That should not happen — try resetting.', 'assertive');
      return;
    }
    boardView.pulseHint(piece.id);
    context.announce(
      `Try the ${ribbonColourName(piece.color)} ribbon. It is clear, pointing ${piece.heading}.`,
    );
  }

  function requestReset(): void {
    if (disposed || attempt.status !== 'idle') return;
    if (attempt.cleared.length > 0 && attempt.hearts > 0) {
      activeDialog = openDialog({
        variant: 'confirm',
        eyebrow: 'A small pause',
        title: 'Start this tangle over?',
        body: 'The board returns to its first tangle and you get all three hearts back.',
        actions: [
          {
            label: 'Start over',
            variant: 'primary',
            onSelect: restart,
          },
          {
            label: 'Keep playing',
            variant: 'secondary',
            autofocus: true,
            onSelect: () => {
              activeDialog = null;
            },
          },
        ],
        onCancel: () => {
          activeDialog = null;
        },
      });
      return;
    }
    restart();
  }

  function restart(): void {
    if (disposed) return;
    activeDialog?.close();
    activeDialog = null;
    attempt = resetAttempt(attempt);
    boardView.render(attempt);
    renderHud();
    updateControls();
    context.announce('A fresh attempt. Three hearts.');
    heading.focus();
  }

  function showWin(stars: number): void {
    if (disposed) return;
    context.announce(`Tangle cleared with ${stars} ${plural(stars, 'star')}.`, 'assertive');

    const visual = el('div', 'win-visual');
    if (constellation) {
      const artWrap = el('div', 'win-constellation');
      artWrap.append(
        createConstellationArt(constellation, { className: 'constellation--win' }),
      );
      const name = el('p', 'win-constellation__name', constellation.name);
      const caption = el('p', 'win-constellation__caption', constellation.caption);
      append(artWrap, name, caption);
      visual.append(artWrap);
    }
    visual.append(createStarRow(stars, 3, { animated: true }));

    const nextLevel = LEVELS[level.index + 1];
    const actions: DialogAction[] = [];
    if (nextLevel) {
      actions.push({
        label: 'Next tangle',
        variant: 'primary',
        autofocus: true,
        onSelect: () => context.navigate(`#/play/${nextLevel.index + 1}`),
      });
      actions.push({
        label: 'Play again',
        variant: 'secondary',
        onSelect: restart,
      });
    } else {
      actions.push({
        label: 'Play again',
        variant: 'primary',
        autofocus: true,
        onSelect: restart,
      });
      actions.push({
        label: 'Back to title',
        variant: 'secondary',
        onSelect: () => context.navigate('#/'),
      });
    }

    activeDialog = openDialog({
      variant: nextLevel ? 'win' : 'campaign',
      eyebrow: nextLevel ? 'A ribbon leaves, a star appears' : 'Campaign complete',
      title: nextLevel ? 'Tangle untangled' : 'The sky is clear',
      body: nextLevel
        ? `You kept ${stars} ${plural(stars, 'heart')}. The next tangle is waiting.`
        : 'Every ribbon has left the board. The whole sky belongs to you now.',
      content: visual,
      actions,
      onCancel: () => context.navigate('#/'),
    });
  }

  function showLoss(): void {
    if (disposed) return;
    context.announce('Out of hearts. Try again.', 'assertive');
    const actions: DialogAction[] = [
      {
        label: 'Try again',
        variant: 'primary',
        autofocus: true,
        onSelect: restart,
      },
      {
        label: 'Back to title',
        variant: 'secondary',
        onSelect: () => context.navigate('#/'),
      },
    ];
    activeDialog = openDialog({
      variant: 'loss',
      eyebrow: 'The tangle held',
      title: 'Out of hearts',
      body: 'Nothing is lost. Take a breath, then look for the ribbon that can slide all the way out.',
      icon: 'heart',
      actions,
      onCancel: restart,
    });
  }

  return {
    element: screen,
    destroy: () => {
      disposed = true;
      window.removeEventListener('keydown', onKeyDown);
      for (const timer of timers) window.clearTimeout(timer);
      timers.clear();
      if (heartTimer !== null) window.clearTimeout(heartTimer);
      activeDialog?.close();
      boardView.destroy();
      screen.remove();
    },
  };
}
