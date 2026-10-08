import { readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { defineConfig } from 'vite';

// HTML entry points live in pages/, one folder per URL (pages/price-tag/index.html
// is served at /price-tag/). We find them all so adding a game needs no config change.
const pagesDir = resolve(import.meta.dirname, 'pages');
const srcDir = resolve(import.meta.dirname, 'src');

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
  // Pages reference scripts as /src/...; point that at the real src/ folder,
  // which sits outside the pages/ root.
  resolve: {
    alias: [{ find: /^\/src\//, replacement: `${srcDir.replaceAll('\\', '/')}/` }],
  },
  server: { fs: { allow: [import.meta.dirname] } },
});
