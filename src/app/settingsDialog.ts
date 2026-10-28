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

export function openSettingsDialog(context: AppContext): DialogHandle {
  const save = context.progress.data;
  const content = el('div', 'settings-content');

  const motionSection = el('section', 'settings-section');
  motionSection.append(el('p', 'settings-section__title', 'Motion'));
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
    label.append(input, document.createTextNode(option.label));
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
  guideSection.append(el('p', 'settings-section__title', 'Nana Pearl'));
  const tipsLabel = el('label', 'settings-toggle');
  const tipsInput = el('input');
  tipsInput.type = 'checkbox';
  tipsInput.checked = save.settings.tips;
  const tipsTrack = el('span', 'settings-toggle__track');
  tipsTrack.setAttribute('aria-hidden', 'true');
  const tipsCopy = el('span', 'settings-toggle__copy');
  tipsCopy.append(
    el('span', 'settings-toggle__title', 'Tips from Nana Pearl'),
    el('span', 'settings-toggle__hint', 'Short, warm notes under the board. Never over it.'),
  );
  tipsLabel.append(tipsInput, tipsTrack, tipsCopy);
  tipsInput.addEventListener('change', () => {
    context.progress.setSettings({ tips: tipsInput.checked });
    context.announce(
      tipsInput.checked
        ? 'Nana Pearl’s tips are on.'
        : 'Nana Pearl’s tips are off. The board stays the same.',
    );
  });
  guideSection.append(tipsLabel);

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
    label.append(input, document.createTextNode(option.label));
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

  const progressSection = el('section', 'settings-section');
  progressSection.append(el('p', 'settings-section__title', 'Progress'));
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
    'Reset erases best stars, unlocks, and tutorial flags on this device.',
  );
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
      resetNote.textContent = 'This cannot be undone. Tap once more to reset everything.';
      if (disarmTimer !== null) window.clearTimeout(disarmTimer);
      disarmTimer = window.setTimeout(() => {
        if (!reset.isConnected) return;
        armed = false;
        reset.textContent = 'Reset progress';
        reset.classList.remove('is-armed');
        resetNote.textContent =
          'Reset erases best stars, unlocks, and tutorial flags on this device.';
      }, 5000);
      return;
    }

    if (disarmTimer !== null) window.clearTimeout(disarmTimer);
    context.progress.reset();
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

  // Keep the settings panel at the top on short screens; Done is still one
  // Tab away, and explicit focus here avoids starting at the bottom action.
  fieldset.querySelector<HTMLInputElement>('input')?.focus();

  return handle;
}
