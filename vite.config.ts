import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite';
import { prerenderPages } from './scripts/lib/prerender.ts';
import { SITE_NAME, SITE_URL } from './src/config.ts';
import { GAMES } from './src/games/catalogue.ts';

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

/** A page's address after the site root, from its HTML file: '' (home), 'about', 'halves/how-to-play'… */
const pageKey = (file: string) => relative(pagesDir, join(file, '..')).replaceAll('\\', '/');

/** The page's title, shown in the browser tab and in share previews. */
function pageTitle(key: string): string {
  if (key === '') return `${SITE_NAME}: original daily word puzzles`;
  if (key === 'about') return `About and privacy – ${SITE_NAME}`;
  const [slug, sub] = key.split('/');
  const game = GAMES.find((g) => g.slug === slug);
  if (!game) return SITE_NAME;
  return sub === 'how-to-play'
    ? `How to play ${game.name} – ${SITE_NAME}`
    : `${game.name} – ${SITE_NAME}`;
}

/**
 * Tags every page shares, added to every index.html under pages/ at build time so
 * the HTML files only hold what differs: language, description and script. It
 * also writes each page's title, and the tags that make a shared link show a
 * title, description and picture (Open Graph, used by most apps and sites).
 */
function sharedHead(): Plugin {
  const meta = (attrs: Record<string, string>): HtmlTagDescriptor => ({ tag: 'meta', attrs });
  const link = (attrs: Record<string, string>): HtmlTagDescriptor => ({ tag: 'link', attrs });
  return {
    name: 'shared-head',
    transformIndexHtml: (html, ctx) => {
      const key = pageKey(ctx.filename);
      const title = pageTitle(key);
      const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
      const url = `${SITE_URL}/${key ? `${key}/` : ''}`;
      return {
        html: html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`),
        tags: [
          ...commonTags(),
          link({ rel: 'canonical', href: url }),
          meta({ property: 'og:type', content: 'website' }),
          meta({ property: 'og:site_name', content: SITE_NAME }),
          meta({ property: 'og:title', content: title }),
          meta({ property: 'og:description', content: description }),
          meta({ property: 'og:url', content: url }),
          meta({ property: 'og:image', content: `${SITE_URL}/og-image.png` }),
          meta({ property: 'og:image:width', content: '1200' }),
          meta({ property: 'og:image:height', content: '630' }),
          meta({
            property: 'og:image:alt',
            content: `${SITE_NAME}: original word puzzles, new every day`,
          }),
          meta({ name: 'twitter:card', content: 'summary_large_image' }),
        ],
      };
    },
  };

  function commonTags(): HtmlTagDescriptor[] {
    return [
      meta({
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, viewport-fit=cover',
      }),
      meta({ name: 'color-scheme', content: 'light dark' }),
      meta({ name: 'theme-color', content: '#f5f7fa', media: '(prefers-color-scheme: light)' }),
      meta({ name: 'theme-color', content: '#13171d', media: '(prefers-color-scheme: dark)' }),
      link({ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }),
      link({ rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }),
      link({ rel: 'manifest', href: '/manifest.webmanifest' }),
      // Not deferred: applies a chosen light/dark theme before the page paints.
      { tag: 'script', attrs: { src: '/theme-init.js' } },
    ];
  }
}

/** Writes sitemap.xml at build time, listing every page, so search engines find them all. */
function sitemap(): Plugin {
  return {
    name: 'sitemap',
    apply: 'build',
    generateBundle() {
      const urls = Object.values(findHtmlEntries(pagesDir))
        .map((file) => pageKey(file))
        .sort()
        .map((key) => `  <url><loc>${SITE_URL}/${key ? `${key}/` : ''}</loc></url>`);
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
      });
    },
  };
}

/**
 * Writes the How to play and About pages' content into their HTML at build
 * time (scripts/lib/prerender.ts), so it's there before any script runs.
 */
function prerender(): Plugin {
  let pages = new Map<string, string>();
  return {
    name: 'prerender',
    apply: 'build',
    async buildStart() {
      pages = await prerenderPages();
    },
    transformIndexHtml: (html, ctx) => {
      const body = pages.get(pageKey(ctx.filename));
      return body ? html.replace(/<body[^>]*>/, (tag) => `${tag}\n${body}`) : html;
    },
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
  plugins: [sharedHead(), prerender(), sitemap()],
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
