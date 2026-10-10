/**
 * Draws the share pictures and app icons into public/:
 *   - og-image.png (1200×630), shown when someone shares a link to the site
 *   - og/<game>.png (1200×630), one per game, shown when someone shares a link to that game
 *   - icon-192.png and icon-512.png, for the web app manifest
 *   - apple-touch-icon.png (180×180), for "Add to Home Screen" on iPhones
 *
 *   npm run build:images
 *
 * Each is drawn as HTML in the site's own fonts and colours (src/styles/tokens.css)
 * and photographed with Playwright's Chromium. Run again after adding a game, or
 * changing a game's name, tagline or home-page picture, the logo or the colours.
 */

import { mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { GAMES, type GameInfo } from '../src/games/catalogue.ts';
import { toHtml, withFakeDom } from './lib/dom-shim.ts';

const ROOT = resolve(import.meta.dirname, '..');
/** A font file as a data: URL, since a page drawn from a string can't load local files. */
const font = (file: string) =>
  `data:font/woff2;base64,${readFileSync(join(ROOT, 'src', 'assets', 'fonts', file)).toString('base64')}`;
const logo = readFileSync(join(ROOT, 'public', 'favicon.svg'), 'utf8').replace(
  /<title>.*?<\/title>/,
  '',
);

const COLOURS = {
  bg: '#f5f7fa',
  panel: '#e3e9f1',
  fg: '#1f2d3d',
  soft: '#45546a',
  muted: '#5a6778',
  accent: '#a84e2b',
};

const FONTS = `
  @font-face { font-family: "Figtree"; font-weight: 300 900; src: url("${font('figtree-latin.woff2')}"); }
  @font-face { font-family: "Young Serif"; src: url("${font('young-serif-latin.woff2')}"); }
  * { box-sizing: border-box; }
  body { margin: 0; }
`;

const NUMBERS = ['', '', '', '', '', '', '', '', '', '', 'Ten', 'Eleven', 'Twelve', 'Thirteen'];
const count = NUMBERS[GAMES.length] || String(GAMES.length);

/** Letter tiles: accent ones for the word, soft ones around it. */
const tiles = (letters: string, accent: boolean) =>
  [...letters]
    .map(
      (ch) =>
        `<span style="display:inline-grid;place-items:center;width:84px;height:84px;border-radius:14px;font:800 46px Figtree;${
          accent
            ? `background:${COLOURS.accent};color:#fff`
            : `background:${COLOURS.panel};color:${COLOURS.soft}`
        }">${ch}</span>`,
    )
    .join('');

/** What every share picture has: its size, the faint word behind, the logo line and the foot. */
const PICTURE = `${FONTS}
  body { width: 1200px; height: 630px; background: ${COLOURS.bg}; color: ${COLOURS.fg}; font-family: Figtree; position: relative; overflow: hidden; }
  .faint { position: absolute; right: -30px; bottom: -70px; font: 400 300px/1 "Young Serif"; letter-spacing: -0.04em; color: ${COLOURS.fg}; opacity: 0.05; white-space: nowrap; }
  .inner { position: absolute; inset: 64px 72px; display: flex; flex-direction: column; }
  .brand { display: flex; align-items: center; gap: 22px; font: 400 56px/1 "Young Serif"; }
  .brand svg { width: 84px; height: 84px; }
  .foot { margin-top: auto; font-size: 28px; font-weight: 600; color: ${COLOURS.soft}; }
`;

const SHARE_PICTURE = `<!doctype html><html><head><style>${PICTURE}
  h1 { margin: 40px 0 0; max-width: 900px; font: 400 64px/1.12 "Young Serif"; letter-spacing: -0.01em; }
  .tiles { display: flex; gap: 10px; margin-top: 40px; }
</style></head><body>
  <div class="faint">W O R D S</div>
  <div class="inner">
    <div class="brand">${logo}<span>Word Games</span></div>
    <h1>${count} original word puzzles, new every day.</h1>
    <div class="tiles">${tiles('PLAY', true)}${tiles('FREE', false)}</div>
    <p class="foot">No ads · No accounts · words.matt-rarely-writes.co.uk</p>
  </div>
</body></html>`;

/** Each game's picture from its home-page card (src/pages/previews.ts), as HTML. */
const previews = await withFakeDom(async () => {
  const { gamePreview } = await import('../src/pages/previews.ts');
  return new Map(GAMES.map(({ slug }) => [slug, toHtml([gamePreview(slug)])]));
});

/** A game's own share picture: its name, its tagline and its home-page picture, drawn large. */
const gamePicture = (game: GameInfo) => `<!doctype html><html><head><style>${PICTURE}
  .brand { gap: 16px; font-size: 38px; }
  .brand svg { width: 58px; height: 58px; }
  h1 { margin: 40px 0 0; font: 400 104px/1.05 "Young Serif"; letter-spacing: -0.02em; }
  .tagline { margin: 14px 0 0; max-width: 1000px; font: 500 34px/1.3 Figtree; color: ${COLOURS.soft}; }
  .pv { display: flex; align-items: center; gap: 12px; min-height: 96px; margin-top: 40px; }
  .pv-tile { display: inline-grid; place-items: center; min-width: 88px; height: 96px; padding: 0 16px; border-radius: 16px; font: 800 44px/1 Figtree; }
  .pv-tile small { display: block; margin-top: 4px; font-size: 24px; font-weight: 700; opacity: 0.8; }
  .pv-soft { background: ${COLOURS.panel}; grid-auto-rows: min-content; align-content: center; }
  .pv-accent { background: ${COLOURS.accent}; color: #fff; }
  .pv-struck { background: ${COLOURS.panel}; color: ${COLOURS.muted}; text-decoration: line-through 4px; }
  .pv-gap { min-width: 68px; border-bottom: 6px solid ${COLOURS.accent}; border-radius: 12px 12px 4px 4px; background: ${COLOURS.panel}; }
  .pv-sep { margin: 0 6px; font-size: 44px; font-weight: 800; color: ${COLOURS.muted}; }
  .pv-word { font: 800 44px/1 Figtree; letter-spacing: 0.06em; }
</style></head><body>
  <div class="faint">${game.name}</div>
  <div class="inner">
    <div class="brand">${logo}<span>Word Games</span></div>
    <h1>${game.name}</h1>
    <p class="tagline">${game.tagline}</p>
    ${previews.get(game.slug)}
    <p class="foot">A new puzzle every day · words.matt-rarely-writes.co.uk</p>
  </div>
</body></html>`;

/** The logo on a plain square, with a margin so nothing is cut off when it's rounded or masked. */
const icon = (size: number) => `<!doctype html><html><head><style>${FONTS}
  body { width: ${size}px; height: ${size}px; display: grid; place-items: center; background: #ffffff; }
  svg { width: ${Math.round(size * 0.78)}px; height: ${Math.round(size * 0.78)}px; }
</style></head><body>${logo}</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
const draw = async (html: string, width: number, height: number, file: string) => {
  await page.setViewportSize({ width, height });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(ROOT, 'public', file) });
  console.log(`Wrote public/${file}`);
};
await draw(SHARE_PICTURE, 1200, 630, 'og-image.png');
mkdirSync(join(ROOT, 'public', 'og'), { recursive: true });
for (const game of GAMES) await draw(gamePicture(game), 1200, 630, `og/${game.slug}.png`);
await draw(icon(512), 512, 512, 'icon-512.png');
await draw(icon(192), 192, 192, 'icon-192.png');
await draw(icon(180), 180, 180, 'apple-touch-icon.png');
await browser.close();
