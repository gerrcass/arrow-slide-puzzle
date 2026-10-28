/*
 * A deliberately small service worker. The shell is network-first so a new
 * deploy is picked up on the next navigation; hashed assets are cache-first
 * because their URLs change when their content does. The install step fetches
 * the built index.html and precaches every local asset it references, so one
 * visit is enough for offline play.
 */

const CACHE_PREFIX = 'nana-pearl-shell-';
// Replaced with the build timestamp by vite.config.ts at build time.
const CACHE_VERSION = '__CACHE_VERSION__';
const CACHE = `${CACHE_PREFIX}${CACHE_VERSION}`;
const ROOT = new URL('./', self.registration.scope);

function assetUrlsFromHtml(html) {
  const urls = new Set();
  const pattern = /(?:src|href)="([^"]+)"/g;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    const raw = match[1];
    if (!raw || raw.startsWith('data:') || raw.startsWith('http')) continue;
    try {
      const url = new URL(raw, ROOT);
      if (url.origin === self.location.origin) urls.add(url.href);
    } catch {
      // Ignore malformed references in the shell.
    }
  }
  return [...urls];
}

async function precache() {
  const cache = await caches.open(CACHE);
  const shellUrl = new URL('./index.html', ROOT).href;
  const rootUrl = ROOT.href;

  const response = await fetch(rootUrl, { cache: 'reload' });
  if (response.ok) {
    await cache.put(rootUrl, response.clone());
    const html = await response.text();
    await cache.put(shellUrl, new Response(html, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    }));
    await Promise.all(
      assetUrlsFromHtml(html).map(async (url) => {
        try {
          const asset = await fetch(url, { cache: 'reload' });
          if (asset.ok) await cache.put(url, asset);
        } catch {
          // A single optional asset should not fail the whole install.
        }
      }),
    );
  }

  await Promise.all(
    [
      new URL('./manifest.webmanifest', ROOT).href,
      new URL('./fonts/fredoka-latin-variable.woff2', ROOT).href,
      new URL('./icons/icon-192.png', ROOT).href,
      new URL('./icons/icon-512.png', ROOT).href,
      new URL('./icons/icon-maskable-512.png', ROOT).href,
    ].map(async (url) => {
      try {
        const asset = await fetch(url, { cache: 'reload' });
        if (asset.ok) await cache.put(url, asset);
      } catch {
        // Optional.
      }
    }),
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(CACHE);
            await cache.put(ROOT.href, response.clone());
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE);
          return (
            (await cache.match(request, { ignoreVary: true })) ??
            (await cache.match(new URL('./index.html', ROOT).href, { ignoreVary: true })) ??
            (await cache.match(ROOT.href, { ignoreVary: true })) ??
            new Response('Offline', { status: 503, headers: { 'content-type': 'text/plain' } })
          );
        }),
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request, { ignoreVary: true });
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    }),
  );
});
