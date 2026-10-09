/**
 * Draws the site's share picture and app icons into public/:
 *   - og-image.png (1200×630), shown when someone shares a link to the site
 *   - icon-192.png and icon-512.png, for the web app manifest
 *   - apple-touch-icon.png (180×180), for "Add to Home Screen" on iPhones
 *
 *   npm run build:images
 *
 * Each is drawn as HTML in the site's own fonts and colours (src/styles/tokens.css)
 * and photographed with Playwright's Chromium. Run again after changing the
 * number of games, the logo or the colours.
 */

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { GAMES } from '../src/games/catalogue.ts';

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

const SHARE_PICTURE = `<!doctype html><html><head><style>${FONTS}
  body { width: 1200px; height: 630px; background: ${COLOURS.bg}; color: ${COLOURS.fg}; font-family: Figtree; position: relative; overflow: hidden; }
  .faint { position: absolute; right: -30px; bottom: -70px; font: 400 300px/1 "Young Serif"; letter-spacing: -0.04em; color: ${COLOURS.fg}; opacity: 0.05; white-space: nowrap; }
  .inner { position: absolute; inset: 64px 72px; display: flex; flex-direction: column; }
  .brand { display: flex; align-items: center; gap: 22px; font: 400 56px/1 "Young Serif"; }
  .brand svg { width: 84px; height: 84px; }
  h1 { margin: 40px 0 0; max-width: 900px; font: 400 64px/1.12 "Young Serif"; letter-spacing: -0.01em; }
  .tiles { display: flex; gap: 10px; margin-top: 40px; }
  .foot { margin-top: auto; font-size: 28px; font-weight: 600; color: ${COLOURS.soft}; }
</style></head><body>
  <div class="faint">W O R D S</div>
  <div class="inner">
    <div class="brand">${logo}<span>Word Games</span></div>
    <h1>${count} original word puzzles, new every day.</h1>
    <div class="tiles">${tiles('PLAY', true)}${tiles('FREE', false)}</div>
    <p class="foot">No ads · No accounts · words.matt-rarely-writes.co.uk</p>
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
await draw(icon(512), 512, 512, 'icon-512.png');
await draw(icon(192), 192, 192, 'icon-192.png');
await draw(icon(180), 180, 180, 'apple-touch-icon.png');
await browser.close();
