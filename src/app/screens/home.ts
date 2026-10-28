import { LEVELS } from '../../content/levels';
import { chapterFor } from '../../content/schema';
import type { AppContext, Screen } from '../context';
import { createBoardArt } from '../ui/boardSvg';
import { createBrandMark } from '../ui/constellation';
import { openDialog } from '../ui/dialog';
import { append, el } from '../ui/dom';
import { createIcon } from '../ui/icons';

export function homeScreen(context: AppContext): Screen {
  const screen = el('main', 'screen home-screen');
  const nav = el('header', 'home-nav');
  const brand = el('div', 'brand');
  brand.append(createBrandMark(), el('span', 'brand__name', 'Nana Pearl’s'));

  const navPill = el('span', 'pill pill--gold');
  navPill.append(createIcon('star', 'icon icon--sm'), 'A twilight puzzle');
  nav.append(brand, navPill);

  const hero = el('section', 'home-hero');
  const copy = el('div', 'home-copy');

  const eyebrow = el('p', 'eyebrow', 'A quiet little tangle');
  const title = el('h1', 'home-title');
  title.append(el('span', 'home-title__line', 'Arrow Slide'), el('span', 'home-title__line home-title__line--soft', 'Puzzle'));
  title.tabIndex = -1;
  title.setAttribute('data-screen-heading', '');
  const lede = el(
    'p',
    'lede home-lede',
    'Glossy ribbons, a violet sky, and one honest rule: a ribbon only leaves when it can slide all the way off the board. Three hearts. No clock. Just look twice.',
  );

  const actions = el('div', 'home-actions');
  const play = el('button', 'btn btn--primary btn--play');
  play.type = 'button';
  play.append(createIcon('play'), 'Play');
  play.addEventListener('click', () => context.navigate('#/levels'));
  const rule = el('button', 'btn btn--secondary');
  rule.type = 'button';
  rule.append(createIcon('sparkle'), 'The rule');
  rule.addEventListener('click', () => {
    openDialog({
      variant: 'info',
      eyebrow: 'The whole rule',
      title: 'Look for the clear ribbon',
      body: 'Tap a ribbon. If every cell can slide clear of the board, it leaves. If anything is in the way, it bumps and costs one heart. Clearing a ribbon can only help — the board never has a dead end.',
      icon: 'star',
      actions: [
        {
          label: 'Got it',
          variant: 'primary',
          autofocus: true,
          onSelect: () => undefined,
        },
      ],
    });
  });
  append(actions, play, rule);

  const save = context.progress.data;
  const nextLevel = context.progress.continueLevel();
  const hasProgress = save.lastPlayed !== null || context.progress.completedCount > 0;
  if (hasProgress && nextLevel !== null) {
    const allDone = context.progress.completedCount >= LEVELS.length;
    const resume = el('button', 'btn btn--ghost home-resume');
    resume.type = 'button';
    resume.append(
      createIcon('arrow-right'),
      allDone ? `Replay level ${nextLevel + 1}` : `Continue level ${nextLevel + 1}`,
    );
    resume.addEventListener('click', () => context.navigate(`#/play/${nextLevel + 1}`));
    actions.append(resume);
  }

  const chapters = new Set(LEVELS.map((level) => level.chapter)).size;
  const meta = el('div', 'home-meta');
  const pieces = LEVELS.reduce((total, level) => total + level.board.pieces.length, 0);
  const metaItems = hasProgress
    ? ([
        { icon: 'star', text: `${context.progress.totalStars} / ${LEVELS.length * 3} stars` },
        { icon: 'check', text: `${context.progress.completedCount} / ${LEVELS.length} cleared` },
        { icon: 'moon', text: chapters === 1 ? '1 chapter' : `${chapters} chapters` },
      ] as const)
    : ([
        { icon: 'sparkle', text: LEVELS.length === 1 ? '1 tangle' : `${LEVELS.length} tangles` },
        { icon: 'moon', text: chapters === 1 ? '1 chapter' : `${chapters} chapters` },
        { icon: 'heart', text: `${pieces} ribbons` },
      ] as const);
  for (const item of metaItems) {
    const pill = el('span', 'pill');
    pill.append(createIcon(item.icon, 'icon icon--sm'), item.text);
    meta.append(pill);
  }

  const ruleCard = el('div', 'home-rule');
  ruleCard.tabIndex = -1;
  const ruleIcon = el('div', 'home-rule__icon');
  ruleIcon.setAttribute('aria-hidden', 'true');
  ruleIcon.append(createIcon('sparkle'));
  const ruleText = el('div', 'home-rule__text');
  const ruleTitle = el('p', 'home-rule__title', 'The whole rule');
  const ruleBody = el(
    'p',
    'home-rule__body',
    'Tap a ribbon. If every cell can slide clear of the board, it leaves. If anything is in the way, it bumps and costs one heart.',
  );
  append(ruleText, ruleTitle, ruleBody);
  append(ruleCard, ruleIcon, ruleText);

  append(copy, eyebrow, title, lede, actions, meta, ruleCard);

  const preview = el('div', 'home-preview');
  preview.setAttribute('aria-hidden', 'true');
  const previewLevel = LEVELS[nextLevel ?? 0];
  const previewFrame = el('div', 'board-frame board-frame--preview');
  const tilt = el('div', 'home-preview__tilt');
  if (previewLevel) {
    const art = createBoardArt(previewLevel.board, {
      seed: previewLevel.seed,
      accent: chapterFor(previewLevel.index).accent,
      className: 'board-art--preview',
    });
    tilt.append(art.svg);
  }
  previewFrame.append(tilt);

  const badgeTop = el('div', 'preview-badge preview-badge--hearts');
  badgeTop.append(createIcon('heart', 'icon icon--sm'), '3 hearts');
  const badgeBottom = el('div', 'preview-badge preview-badge--stars');
  badgeBottom.append(createIcon('star', 'icon icon--sm'), '3 stars');
  append(preview, previewFrame, badgeTop, badgeBottom);

  append(hero, copy, preview);

  const footer = el('footer', 'home-footer');
  footer.append(
    el('span', '', 'No accounts. No timers. No noise.'),
    el('span', 'home-footer__dot', '·'),
    el('span', '', 'Made for a quiet minute.'),
  );

  append(screen, nav, hero, footer);
  document.title = 'Nana Pearl’s Arrow Slide Puzzle';

  return {
    element: screen,
    destroy: () => {
      screen.remove();
    },
  };
}
