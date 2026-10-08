import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite';

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

/**
 * Tags every page shares, added to every index.html under pages/ at build time so
 * the HTML files only hold what differs: language, title, description and script.
 */
function sharedHead(): Plugin {
  const meta = (attrs: Record<string, string>): HtmlTagDescriptor => ({ tag: 'meta', attrs });
  return {
    name: 'shared-head',
    transformIndexHtml: () => [
      meta({
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, viewport-fit=cover',
      }),
      meta({ name: 'color-scheme', content: 'light dark' }),
      meta({ name: 'theme-color', content: '#f5f7fa', media: '(prefers-color-scheme: light)' }),
      meta({ name: 'theme-color', content: '#13171d', media: '(prefers-color-scheme: dark)' }),
      { tag: 'link', attrs: { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' } },
      // Not deferred: applies a chosen light/dark theme before the page paints.
      { tag: 'script', attrs: { src: '/theme-init.js' } },
    ],
  };
}

/**
 * The same security headers the live site sends (public/staticwebapp.config.json),
 * so `vite preview`, and the Playwright tests that use it, behave like production
 * and anything the policy blocks shows up locally. (As in card-kit's vite.ts.)
 */
function previewHeaders(): Record<string, string> {
  const live = JSON.parse(
    readFileSync(resolve(import.meta.dirname, 'public', 'staticwebapp.config.json'), 'utf8'),
  ) as { globalHeaders: Record<string, string> };
  const headers = { ...live.globalHeaders };
  // The plain-http local preview mustn't be forced onto https.
  headers['Content-Security-Policy'] = (headers['Content-Security-Policy'] ?? '').replace(
    '; upgrade-insecure-requests',
    '',
  );
  delete headers['Strict-Transport-Security'];
  return headers;
}

export default defineConfig({
  plugins: [sharedHead()],
  root: pagesDir,
  // Multi-page app: unknown URLs 404 (as on the live site) instead of serving index.html.
  appType: 'mpa',
  publicDir: resolve(import.meta.dirname, 'public'),
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    // Keep fonts and images as real files: the security policy doesn't allow data: fonts.
    assetsInlineLimit: 0,
    rollupOptions: { input: findHtmlEntries(pagesDir) },
  },
  // Pages reference scripts as /src/...; point that at the real src/ folder,
  // which sits outside the pages/ root.
  resolve: {
    alias: [{ find: /^\/src\//, replacement: `${srcDir.replaceAll('\\', '/')}/` }],
  },
  server: { fs: { allow: [import.meta.dirname] } },
  preview: { headers: previewHeaders() },
});
