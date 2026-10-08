/** Shared helpers for the Playwright tests. */

import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';
import type { PuzzleMonthFile } from '../../src/core/game.ts';

/** The dictionary, for picking valid test words. */
export const WORDS = readFileSync('public/data/words.txt', 'utf8').trim().split('\n');

/** Read a pre-generated puzzle straight from the repo. */
export function puzzleFor<P, S>(slug: string, date: string) {
  const file = JSON.parse(
    readFileSync(`public/puzzles/${slug}/${date.slice(0, 7)}.json`, 'utf8'),
  ) as PuzzleMonthFile<P, S>;
  const day = file.days[date];
  if (!day) throw new Error(`No ${slug} puzzle for ${date}; run npm run generate`);
  return day;
}

/**
 * Freeze the page's clock at midday on `date` and mark the game's help as
 * already seen (so the first-visit dialog doesn't get in the way).
 */
export async function setUp(page: Page, date: string, opts: { seenHelp?: string } = {}) {
  await page.clock.setFixedTime(new Date(`${date}T12:00:00`));
  if (opts.seenHelp) {
    await page.addInitScript((slug) => {
      if (!sessionStorage.getItem('e2e-init')) {
        localStorage.setItem(`wg:${slug}:seen-help`, 'true');
        sessionStorage.setItem('e2e-init', '1');
      }
    }, opts.seenHelp);
  }
}

/** Type a word with the physical keyboard and press Enter. */
export async function enterWord(page: Page, word: string) {
  // Wait until the puzzle has loaded and the word box is ready.
  await expect(page.getByRole('textbox', { name: 'Your word' })).toBeEditable();
  await page.keyboard.type(word);
  await page.keyboard.press('Enter');
}

/** Fail the test on any WCAG A/AA violation axe can detect. */
export async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
}

/** Fail if the page scrolls sideways (a common mobile layout bug). */
export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}
