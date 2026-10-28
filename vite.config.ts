import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/**
 * Give each production build its own service-worker cache, so old hashed
 * assets are cleaned up by the activate handler instead of accumulating.
 */
function versionServiceWorker(): Plugin {
  return {
    name: 'version-service-worker',
    closeBundle() {
      const file = resolve(process.cwd(), 'dist/sw.js');
      const source = readFileSync(file, 'utf8');
      writeFileSync(file, source.replace('__CACHE_VERSION__', String(Date.now())));
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [versionServiceWorker()],
  build: {
    target: 'es2022',
    cssCodeSplit: false,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    testTimeout: 20000,
  },
});
