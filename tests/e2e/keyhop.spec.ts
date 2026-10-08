import { expect, test } from '@playwright/test';
import {
  followsRules,
  type KeyhopPuzzle,
  type KeyhopSolution,
} from '../../src/games/keyhop/spec.ts';
import { keySteps } from '../../src/solvers/qwerty.ts';
import {
  enterWord,
  expectAccessible,
  expectNoHorizontalScroll,
  puzzleFor,
  setUp,
  WORDS,
} from './helpers.ts';

const DATE = '2026-10-08';
const { puzzle, solution } = puzzleFor<KeyhopPuzzle, KeyhopSolution>('keyhop', DATE);
const S = puzzle.start.toUpperCase();
const best = solution.answers[0] as string;
const shorter = WORDS.find(
  (w) => followsRules(w, puzzle) && w.length < solution.bestLength,
) as string;
const far = [...'abcdefghijklmnopqrstuvwxyz'].find(
  (c) => keySteps(puzzle.start, c) > puzzle.reach,
) as string;
const near = [...'abcdefghijklmnopqrstuvwxyz'].find(
  (c) => c !== puzzle.start && keySteps(puzzle.start, c) <= puzzle.reach,
) as string;

test.beforeEach(async ({ page }) => {
  await page.route(/ko-fi\.com/, (route) => route.abort());
  await setUp(page, DATE, { seenHelp: 'keyhop' });
});

const key = (page: import('@playwright/test').Page, letter: string) =>
  page
    .locator('.keyboard')
    .getByRole('button', { name: new RegExp(`^${letter.toUpperCase()}(,|$)`) });

test.describe('Keyhop', () => {
  test("shows the day's rules and lights only the starting key", async ({ page }) => {
    await page.goto('/keyhop/');
    await expect(page.locator('.kh-rules')).toContainText(`Start on ${S}`);
    await expect(page.locator('.kh-rules')).toContainText(`${puzzle.reach} keys`);
    await expect(key(page, puzzle.start)).toBeEnabled();
    await expect(key(page, near)).toBeDisabled();
    await expectAccessible(page);
    await expectNoHorizontalScroll(page);
  });

  test('after a letter, keys within reach light up and far ones switch off', async ({ page }) => {
    await page.goto('/keyhop/');
    await key(page, puzzle.start).click();
    await expect(key(page, near)).toBeEnabled();
    await expect(key(page, far)).toBeDisabled();
    await expect(page.locator('.live-line')).toContainText(`within reach of ${S}`);
  });

  test('keeps the longest word and finishes on the longest possible', async ({ page }) => {
    await page.goto('/keyhop/');
    await enterWord(page, shorter);
    await expect(page.locator('.best-line')).toContainText(
      `Your longest: ${shorter.toUpperCase()}`,
    );
    await enterWord(page, best);
    const results = page.getByRole('dialog', { name: 'Perfect!' });
    await expect(results).toContainText('You found the longest word');
    await expectAccessible(page);
  });

  test('has a How to play page', async ({ page }) => {
    await page.goto('/keyhop/how-to-play/');
    await expect(page.getByRole('heading', { level: 1, name: 'Keyhop' })).toBeVisible();
    await expectAccessible(page);
  });
});
