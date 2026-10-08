import { readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { defineConfig } from 'vite';

// HTML entry points live in pages/, one folder per URL (pages/price-tag/index.html
// is served at /price-tag/). We find them all so adding a game needs no config change.
const pagesDir = resolve(import.meta.dirname, 'pages');

function findHtmlEntries(dir: string): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      Object.assign(entries, findHtmlEntries(full));
    } else if (name === 'index.html') {
      const key = relative(pagesDir, dir).replaceAll('\\', '/') || 'home';
      entries[key] = full;
    }
  }
  return entries;
}

export default defineConfig({
  root: pagesDir,
  // Multi-page app: unknown URLs 404 (as on the live site) instead of serving index.html.
  appType: 'mpa',
  publicDir: resolve(import.meta.dirname, 'public'),
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: { input: findHtmlEntries(pagesDir) },
  },
  server: { fs: { allow: [import.meta.dirname] } },
});
