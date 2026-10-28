import { LEVELS } from '../content/levels';
import type { AppContext, Screen } from './context';
import {
  applyMotionAttribute,
  resolveReducedMotion,
  systemPrefersReducedMotion,
} from './motion';
import type { ProgressStore } from './progress';
import { parseRoute, resolveRoute, routeHash } from './router';
import { homeScreen } from './screens/home';
import { levelsScreen } from './screens/levels';
import { playScreen } from './screens/play';
import { openSettingsDialog } from './settingsDialog';
import { el } from './ui/dom';
import type { DialogHandle } from './ui/dialog';

export class App {
  private readonly root: HTMLElement;
  private readonly progress: ProgressStore;
  private readonly politeRegion: HTMLElement;
  private readonly assertiveRegion: HTMLElement;
  private readonly context: AppContext;
  private readonly mediaQuery: MediaQueryList | null;
  private currentScreen: Screen | null = null;
  private settingsDialog: DialogHandle | null = null;
  private politeTimer: number | null = null;
  private assertiveTimer: number | null = null;

  constructor(root: HTMLElement, progress: ProgressStore) {
    this.root = root;
    this.progress = progress;
    this.root.classList.add('app');
    this.root.replaceChildren();

    const ambient = el('div', 'ambient');
    ambient.setAttribute('aria-hidden', 'true');
    for (const modifier of ['rose', 'violet', 'mint']) {
      ambient.append(el('div', `ambient__glow ambient__glow--${modifier}`));
    }
    ambient.append(el('div', 'ambient__stars'));

    this.politeRegion = el('div', 'live-region');
    this.politeRegion.setAttribute('aria-live', 'polite');
    this.politeRegion.setAttribute('aria-atomic', 'true');
    this.assertiveRegion = el('div', 'live-region');
    this.assertiveRegion.setAttribute('aria-live', 'assertive');
    this.assertiveRegion.setAttribute('aria-atomic', 'true');

    this.root.append(ambient, this.politeRegion, this.assertiveRegion);

    this.context = {
      progress: this.progress,
      navigate: (hash) => this.navigate(hash),
      announce: (message, priority = 'polite') => this.announce(message, priority),
      openSettings: () => this.openSettings(),
      isReducedMotion: () =>
        resolveReducedMotion(
          this.progress.data.settings.motion,
          systemPrefersReducedMotion(),
        ),
    };

    this.mediaQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    this.applyMotion();
    this.mediaQuery?.addEventListener('change', () => this.applyMotion());
  }

  start(): void {
    window.addEventListener('hashchange', () => this.render());
    this.render();
  }

  navigate(hash: string): void {
    if (window.location.hash === hash) {
      this.render();
      return;
    }
    window.location.hash = hash;
  }

  announce(message: string, priority: 'polite' | 'assertive'): void {
    const region = priority === 'assertive' ? this.assertiveRegion : this.politeRegion;
    const other = priority === 'assertive' ? this.politeRegion : this.assertiveRegion;
    other.textContent = '';
    region.textContent = '';
    const timer = window.setTimeout(() => {
      region.textContent = message;
    }, 24);
    if (priority === 'assertive') {
      if (this.assertiveTimer !== null) window.clearTimeout(this.assertiveTimer);
      this.assertiveTimer = timer;
    } else {
      if (this.politeTimer !== null) window.clearTimeout(this.politeTimer);
      this.politeTimer = timer;
    }
  }

  private applyMotion(): void {
    applyMotionAttribute(
      resolveReducedMotion(
        this.progress.data.settings.motion,
        systemPrefersReducedMotion(),
      ),
    );
  }

  private openSettings(): void {
    if (document.querySelector('dialog[open]')) return;
    this.settingsDialog = openSettingsDialog(this.context);
  }

  private render(): void {
    const parsed = parseRoute(window.location.hash, LEVELS.length);
    const resolved = resolveRoute(
      parsed,
      LEVELS.length,
      (index) => this.progress.isUnlocked(index),
    );

    if (resolved.replace) {
      window.history.replaceState(null, '', routeHash(resolved.route));
    }

    if (resolved.route.name === 'home') {
      this.showScreen(homeScreen(this.context));
      return;
    }

    if (resolved.route.name === 'levels') {
      this.showScreen(levelsScreen(this.context, resolved.notice ?? null));
      return;
    }

    const level = LEVELS[resolved.route.index];
    if (!level) {
      this.showScreen(homeScreen(this.context));
      return;
    }
    this.showScreen(playScreen(this.context, level));
  }

  private showScreen(screen: Screen): void {
    this.settingsDialog?.close();
    this.settingsDialog = null;
    this.currentScreen?.destroy?.();
    this.currentScreen?.element.remove();
    this.currentScreen = screen;
    this.root.append(screen.element);
    const heading = screen.element.querySelector<HTMLElement>('[data-screen-heading]');
    heading?.focus({ preventScroll: true });
  }
}
