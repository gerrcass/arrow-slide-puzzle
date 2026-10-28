import type { ProgressStore } from './progress';

export interface Screen {
  readonly element: HTMLElement;
  readonly destroy?: () => void;
}

export interface AppContext {
  readonly progress: ProgressStore;
  readonly navigate: (hash: string) => void;
  readonly announce: (message: string, priority?: 'polite' | 'assertive') => void;
  readonly openSettings: () => void;
  readonly isReducedMotion: () => boolean;
}

export type ScreenFactory = (context: AppContext) => Screen;
