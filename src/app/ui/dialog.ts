import { createActionButton, el, svgEl } from './dom';
import { createIcon } from './icons';

export interface DialogAction {
  readonly label: string;
  readonly variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  readonly onSelect: () => void;
  readonly autofocus?: boolean;
}

export interface DialogOptions {
  readonly variant: 'win' | 'loss' | 'campaign' | 'confirm' | 'settings' | 'info';
  readonly eyebrow?: string | undefined;
  readonly title: string;
  readonly body?: string | undefined;
  readonly actions: readonly DialogAction[];
  readonly content?: Node | undefined;
  readonly onCancel?: (() => void) | undefined;
  readonly dismissible?: boolean;
  readonly icon?: 'heart' | 'star' | 'check' | 'moon';
}

export interface DialogHandle {
  readonly dialog: HTMLDialogElement;
  close(): void;
}

let dialogCounter = 0;

export function openDialog(options: DialogOptions): DialogHandle {
  dialogCounter += 1;
  const previouslyFocused = document.activeElement;
  const titleId = `dialog-title-${dialogCounter}`;
  const bodyId = `dialog-body-${dialogCounter}`;
  const dialog = el('dialog', `dialog dialog--${options.variant}`);
  dialog.setAttribute('aria-labelledby', titleId);
  if (options.body) dialog.setAttribute('aria-describedby', bodyId);

  const panel = el('div', 'dialog-panel');
  const halo = el('div', 'dialog-halo');
  halo.setAttribute('aria-hidden', 'true');
  panel.append(halo);

  if (options.dismissible !== false) {
    const closeButton = el('button', 'dialog-close');
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.append(createIcon('close'));
    closeButton.addEventListener('click', () => {
      if (options.onCancel) options.onCancel();
      close();
    });
    panel.append(closeButton);
  }

  if (options.icon) {
    const iconWrap = el('div', `dialog-icon dialog-icon--${options.icon}`);
    iconWrap.setAttribute('aria-hidden', 'true');
    iconWrap.append(createIcon(options.icon, 'icon icon--lg'));
    panel.append(iconWrap);
  }

  if (options.eyebrow) {
    const eyebrow = el('p', 'eyebrow', options.eyebrow);
    panel.append(eyebrow);
  }

  const title = el('h2', 'dialog-title', options.title);
  title.id = titleId;
  panel.append(title);

  if (options.body) {
    const body = el('p', 'dialog-body', options.body);
    body.id = bodyId;
    panel.append(body);
  }

  if (options.content) {
    panel.append(options.content);
  }

  const actions = el('div', 'dialog-actions');
  for (const action of options.actions) {
    const button = createActionButton(action.label, action.variant, () => {
      close();
      action.onSelect();
    });
    if (action.autofocus) button.setAttribute('autofocus', '');
    actions.append(button);
  }
  if (actions.childElementCount > 0) panel.append(actions);

  dialog.append(panel);
  document.body.append(dialog);

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    if (dialog.open) dialog.close();
    dialog.remove();
    // Native <dialog> restores focus only while it remains connected; screens
    // replace their whole subtree, so restore the invoking control explicitly.
    // Ribbons are SVG elements, so the fallback must cover them too.
    if (
      (previouslyFocused instanceof HTMLElement ||
        previouslyFocused instanceof SVGElement) &&
      previouslyFocused.isConnected &&
      !previouslyFocused.closest('dialog')
    ) {
      previouslyFocused.focus({ preventScroll: true });
    }
  };

  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    if (options.dismissible === false) return;
    if (options.onCancel) options.onCancel();
    close();
  });

  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    if (options.dismissible === false) return;
    if (options.onCancel) options.onCancel();
    close();
  });

  dialog.showModal();

  const focusTarget =
    dialog.querySelector<HTMLButtonElement>('[autofocus]') ??
    dialog.querySelector<HTMLButtonElement>('.dialog-actions button') ??
    dialog.querySelector<HTMLButtonElement>('.dialog-close');
  focusTarget?.focus({ preventScroll: true });
  // Autofocus can scroll a tall result dialog straight to its actions. Start
  // every dialog at the top so the title, constellation, and close stay visible.
  dialog.scrollTop = 0;
  panel.scrollTop = 0;

  return { dialog, close };
}

export function createStarBurst(): SVGSVGElement {
  const svg = svgEl('svg', {
    viewBox: '0 0 240 120',
    class: 'star-burst',
    'aria-hidden': 'true',
    focusable: 'false',
  });
  const points = [
    [20, 82, 2],
    [44, 30, 1.2],
    [72, 64, 1.6],
    [96, 18, 1],
    [122, 54, 2.2],
    [148, 26, 1.1],
    [176, 74, 1.5],
    [204, 36, 1.8],
    [222, 88, 1],
  ] as const;
  for (const [x, y, size] of points) {
    svg.append(
      svgEl('circle', {
        cx: String(x),
        cy: String(y),
        r: String(size),
        fill: '#ffe8b8',
        opacity: '0.75',
      }),
    );
  }
  return svg;
}
