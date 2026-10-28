export type MotionSetting = 'system' | 'reduced' | 'full';

export function resolveReducedMotion(
  setting: MotionSetting,
  systemPrefersReduced: boolean,
): boolean {
  if (setting === 'reduced') return true;
  if (setting === 'full') return false;
  return systemPrefersReduced;
}

export function systemPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function applyMotionAttribute(reduced: boolean): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
}
