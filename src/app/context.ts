export interface Screen {
  readonly element: HTMLElement;
  readonly destroy?: () => void;
}

export interface AppContext {
  readonly navigate: (hash: string) => void;
  readonly announce: (message: string, priority?: 'polite' | 'assertive') => void;
  readonly isReducedMotion: () => boolean;
}

export type ScreenFactory = (context: AppContext) => Screen;
