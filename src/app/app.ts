import { LEVELS } from '../content/levels';
import type { AppContext, Screen } from './context';
import { applyMotionAttribute, systemPrefersReducedMotion } from './motion';
import { parseRoute } from './router';
import { homeScreen } from './screens/home';
import { playScreen } from './screens/play';
import { el } from './ui/dom';

export class App {
  private readonly root: HTMLElement;
  private readonly politeRegion: HTMLElement;
  private readonly assertiveRegion: HTMLElement;
  private currentScreen: Screen | null = null;
  private politeTimer: number | null = null;
  private assertiveTimer: number | null = null;
  private readonly context: AppContext;
  private readonly mediaQuery: MediaQueryList | null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.root.classList.add('app');
    this.root.replaceChildren();

    const ambient = el('div', 'ambient');
    ambient.setAttribute('aria-hidden', 'true');
    for (const modifier of ['rose', 'violet', 'mint']) {
      const glow = el('div', `ambient__glow ambient__glow--${modifier}`);
      ambient.append(glow);
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
      navigate: (hash) => this.navigate(hash),
      announce: (message, priority = 'polite') => this.announce(message, priority),
      isReducedMotion: () => systemPrefersReducedMotion(),
    };

    this.mediaQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    applyMotionAttribute(this.context.isReducedMotion());
    this.mediaQuery?.addEventListener('change', () => {
      applyMotionAttribute(this.context.isReducedMotion());
    });
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

  private render(): void {
    const route = parseRoute(window.location.hash, LEVELS.length);

    if (route.name === 'unknown') {
      window.history.replaceState(null, '', '#/');
      this.showScreen(homeScreen(this.context));
      return;
    }

    if (route.name === 'home') {
      this.showScreen(homeScreen(this.context));
      return;
    }

    const level = LEVELS[route.index];
    if (!level) {
      this.showScreen(homeScreen(this.context));
      return;
    }
    this.showScreen(playScreen(this.context, level));
  }

  private showScreen(screen: Screen): void {
    this.currentScreen?.destroy?.();
    this.currentScreen?.element.remove();
    this.currentScreen = screen;
    this.root.append(screen.element);
    const heading = screen.element.querySelector<HTMLElement>('[data-screen-heading]');
    heading?.focus({ preventScroll: true });
  }
}
