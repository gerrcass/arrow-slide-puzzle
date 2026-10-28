import type { AppContext } from './context';
import {
  applyMotionAttribute,
  resolveReducedMotion,
  systemPrefersReducedMotion,
  type MotionSetting,
} from './motion';
import type { GuideVoice } from './progress';
import { el } from './ui/dom';
import { openDialog, type DialogHandle } from './ui/dialog';
import { createIcon } from './ui/icons';

const MOTION_OPTIONS: readonly { value: MotionSetting; label: string }[] = [
  { value: 'system', label: 'Follow device' },
  { value: 'full', label: 'Full motion' },
  { value: 'reduced', label: 'Reduced motion' },
];

const VOICE_OPTIONS: readonly { value: GuideVoice; label: string }[] = [
  { value: 'nana', label: 'Nana’s voice' },
  { value: 'brief', label: 'Brief' },
];

interface ToggleOptions {
  readonly title: string;
  readonly hint: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}

function createChoiceTick(): HTMLSpanElement {
  const tick = el('span', 'settings-choice__tick');
  tick.setAttribute('aria-hidden', 'true');
  tick.textContent = '✓';
  return tick;
}

function createToggle(options: ToggleOptions): {
  readonly label: HTMLLabelElement;
  readonly input: HTMLInputElement;
} {
  const label = el('label', 'settings-toggle');
  const input = el('input');
  input.type = 'checkbox';
  input.checked = options.checked;
  const track = el('span', 'settings-toggle__track');
  track.setAttribute('aria-hidden', 'true');
  const copy = el('span', 'settings-toggle__copy');
  copy.append(
    el('span', 'settings-toggle__title', options.title),
    el('span', 'settings-toggle__hint', options.hint),
  );
  label.append(input, track, copy);
  input.addEventListener('change', () => options.onChange(input.checked));
  return { label, input };
}

export function openSettingsDialog(context: AppContext): DialogHandle {
  const save = context.progress.data;
  const content = el('div', 'settings-content');

  const soundSection = el('section', 'settings-section');
  soundSection.append(el('h3', 'settings-section__title', 'Sound'));
  const soundToggle = createToggle({
    title: 'Sound',
    hint: 'Soft synthesised slides, bumps, hearts, and a five-note win.',
    checked: save.settings.sound,
    onChange: (checked) => context.setSound(checked),
  });
  soundSection.append(soundToggle.label);
  content.append(soundSection);

  const motionSection = el('section', 'settings-section');
  motionSection.append(el('h3', 'settings-section__title', 'Motion'));
  const fieldset = el('fieldset', 'settings-fieldset');
  fieldset.append(el('legend', 'visually-hidden', 'Motion preference'));
  for (const option of MOTION_OPTIONS) {
    const label = el('label', 'settings-choice');
    const input = el('input');
    input.type = 'radio';
    input.name = 'motion';
    input.value = option.value;
    input.checked = save.settings.motion === option.value;
    input.addEventListener('change', () => {
      if (!input.checked) return;
      context.progress.setSettings({ motion: option.value });
      applyMotionAttribute(
        resolveReducedMotion(option.value, systemPrefersReducedMotion()),
      );
      context.announce(
        option.value === 'system'
          ? 'Motion now follows your device.'
          : `Motion set to ${option.value}.`,
      );
    });
    label.append(
      input,
      createChoiceTick(),
      el('span', 'settings-choice__label', option.label),
    );
    fieldset.append(label);
  }
  motionSection.append(fieldset);
  motionSection.append(
    el(
      'p',
      'settings-note',
      'Follow device respects your system setting. Reduced motion keeps state changes and removes long travel.',
    ),
  );
  content.append(motionSection);

  const guideSection = el('section', 'settings-section');
  guideSection.append(el('h3', 'settings-section__title', 'Nana Pearl'));
  const tipsToggle = createToggle({
    title: 'Tips from Nana Pearl',
    hint: 'Short, warm notes under the board. Never over it.',
    checked: save.settings.tips,
    onChange: (checked) => {
      context.progress.setSettings({ tips: checked });
      context.announce(
        checked
          ? 'Nana Pearl’s tips are on.'
          : 'Nana Pearl’s tips are off. The board stays the same.',
      );
    },
  });
  guideSection.append(tipsToggle.label);

  const voiceFieldset = el('fieldset', 'settings-fieldset');
  voiceFieldset.append(el('legend', 'settings-fieldset__legend', 'Guide copy'));
  for (const option of VOICE_OPTIONS) {
    const label = el('label', 'settings-choice');
    const input = el('input');
    input.type = 'radio';
    input.name = 'guideVoice';
    input.value = option.value;
    input.checked = save.settings.guideVoice === option.value;
    input.addEventListener('change', () => {
      if (!input.checked) return;
      context.progress.setSettings({ guideVoice: option.value });
      context.announce(
        option.value === 'nana' ? 'Nana Pearl’s full voice.' : 'Brief guide copy.',
      );
    });
    label.append(
      input,
      createChoiceTick(),
      el('span', 'settings-choice__label', option.label),
    );
    voiceFieldset.append(label);
  }
  guideSection.append(voiceFieldset);

  const replayNote = el(
    'p',
    'settings-note',
    'Replays the welcome card and three tutorial beats on level one. Stars and collected constellations stay.',
  );
  const replay = el('button', 'btn btn--secondary');
  replay.type = 'button';
  replay.append(createIcon('sparkle', 'icon icon--sm'), 'Replay tutorial');
  replay.addEventListener('click', () => {
    context.progress.resetTutorial();
    context.announce('The tutorial will start again on level one.');
    handle?.close();
    context.navigate('#/play/1');
  });
  guideSection.append(replay, replayNote);
  content.append(guideSection);

  const accessSection = el('section', 'settings-section');
  accessSection.append(el('h3', 'settings-section__title', 'Access'));
  const assistiveToggle = createToggle({
    title: 'Assistive mode',
    hint: 'Ribbon names include clear or blocked, and a describe action appears under the board.',
    checked: save.settings.assistive,
    onChange: (checked) => {
      context.progress.setSettings({ assistive: checked });
      context.announce(
        checked
          ? 'Assistive mode on. Ribbon names now say clear or blocked.'
          : 'Assistive mode off. Ribbon names keep the colour, cells, and heading.',
      );
    },
  });
  accessSection.append(assistiveToggle.label);
  content.append(accessSection);

  const progressSection = el('section', 'settings-section');
  progressSection.append(el('h3', 'settings-section__title', 'Progress'));
  const stats = el('div', 'settings-stats');
  const starsPill = el('span', 'pill pill--gold');
  starsPill.append(createIcon('star', 'icon icon--sm'), `${context.progress.totalStars} / 36 stars`);
  const clearedPill = el('span', 'pill');
  clearedPill.append(
    createIcon('check', 'icon icon--sm'),
    `${context.progress.completedCount} / 12 cleared`,
  );
  stats.append(starsPill, clearedPill);
  progressSection.append(stats);

  const resetNote = el(
    'p',
    'settings-note',
    'Reset erases best stars, unlocks, and tutorial progress. Your sound, motion, and access preferences stay.',
  );
  resetNote.setAttribute('role', 'status');
  resetNote.setAttribute('aria-live', 'polite');
  const reset = el('button', 'btn btn--danger');
  reset.type = 'button';
  reset.textContent = 'Reset progress';
  let armed = false;
  let disarmTimer: number | null = null;
  let handle: DialogHandle | null = null;

  reset.addEventListener('click', () => {
    if (!armed) {
      armed = true;
      reset.textContent = 'Tap again to erase';
      reset.classList.add('is-armed');
      resetNote.textContent =
        'This cannot be undone. Tap once more to reset campaign progress. Your preferences stay.';
      if (disarmTimer !== null) window.clearTimeout(disarmTimer);
      disarmTimer = window.setTimeout(() => {
        if (!reset.isConnected) return;
        armed = false;
        reset.textContent = 'Reset progress';
        reset.classList.remove('is-armed');
        resetNote.textContent =
          'Reset erases best stars, unlocks, and tutorial progress. Your sound, motion, and access preferences stay.';
      }, 5000);
      return;
    }

    if (disarmTimer !== null) window.clearTimeout(disarmTimer);
    context.progress.reset();
    context.audio.setEnabled(context.progress.data.settings.sound);
    applyMotionAttribute(
      resolveReducedMotion(
        context.progress.data.settings.motion,
        systemPrefersReducedMotion(),
      ),
    );
    context.announce('Progress reset. Every tangle is new again.');
    handle?.close();
    context.navigate('#/levels');
  });

  const actions = el('div', 'settings-actions');
  actions.append(reset);
  progressSection.append(actions, resetNote);
  content.append(progressSection);

  handle = openDialog({
    variant: 'settings',
    eyebrow: 'Preferences',
    title: 'Settings',
    content,
    actions: [
      {
        label: 'Done',
        variant: 'primary',
        autofocus: true,
        onSelect: () => undefined,
      },
    ],
  });

  // Start at the top control; the focus trap keeps Done reachable by Tab.
  soundToggle.input.focus({ preventScroll: true });

  return handle;
}
