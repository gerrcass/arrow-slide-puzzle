/**
 * Register the offline shell only in production. In development a cached
 * service worker would hide Vite's hot updates, so we leave it out entirely.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('./sw.js').catch(() => {
      // Offline support is a bonus; the game itself works without it.
    });
  });
}
