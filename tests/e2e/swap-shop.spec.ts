import { expect, test } from '@playwright/test';
import type { SwapShopPuzzle, SwapShopSolution } from '../../src/games/swap-shop/spec.ts';
import {
  enterWord,
  expectAccessible,
  expectNoHorizontalScroll,
  puzzleFor,
  setUp,
} from './helpers.ts';

const DATE = '2026-10-08';
const { puzzle, solution } = puzzleFor<SwapShopPuzzle, SwapShopSolution>('swap-shop', DATE);
const [A, B] = puzzle.letters.toUpperCase();
const total = solution.pairs.length;
const [firstPair = ''] = solution.pairs;
const [firstWord = '', twin = ''] = firstPair.split('/');

test.beforeEach(async ({ page }) => {
  await page.route(/ko-fi\.com/, (route) => route.abort());
  await setUp(page, DATE, { seenHelp: 'swap-shop' });
});

test.describe('Swap Shop', () => {
  test('shows the swap, the length rule and the pair count', async ({ page }) => {
    await page.goto('/swap-shop/');
    await expect(page.locator('.ss-swap')).toContainText(`${A} swaps with ${B}`);
    if (puzzle.length)
      await expect(page.locator('.ss-rule')).toHaveText(`${puzzle.length}-letter words only`);
    await expect(page.locator('.ss-counter')).toHaveText(`Found 0 of ${total} pairs`);
    await expect(page.getByRole('button', { name: `${A}, ↔${B}` })).toBeVisible();
    await expectAccessible(page);
    await expectNoHorizontalScroll(page);
  });

  test('previews the swap while typing', async ({ page }) => {
    await page.goto('/swap-shop/');
    await expect(page.getByRole('textbox', { name: 'Your word' })).toBeEditable();
    await page.keyboard.type(firstWord);
    await expect(page.locator('.live-line')).toHaveText(
      `${firstWord.toUpperCase()} → ${twin.toUpperCase()}`,
    );
  });

  test('either word finds the pair, once', async ({ page }) => {
    await page.goto('/swap-shop/');
    await enterWord(page, twin);
    await expect(page.locator('.feedback')).toContainText(
      `${firstWord.toUpperCase()} ↔ ${twin.toUpperCase()}: a pair!`,
    );
    await expect(page.locator('.ss-counter')).toHaveText(`Found 1 of ${total} pairs`);
    await enterWord(page, firstWord);
    await expect(page.locator('.feedback')).toContainText("You've already found");
  });

  test('explains rejected words', async ({ page }) => {
    await page.goto('/swap-shop/');
    await enterWord(page, 'qzxq');
    await expect(page.locator('.feedback')).toContainText("isn't in the word list");
  });

  test('finishing early lists the pairs missed', async ({ page }) => {
    await page.goto('/swap-shop/');
    await enterWord(page, firstWord);
    await page.getByRole('button', { name: 'Finish' }).click();
    await page.getByRole('button', { name: 'Finish and see answers' }).click();
    const results = page.getByRole('dialog', { name: 'Nice try' });
    await expect(results).toContainText(`You found 1 of the ${total} pairs.`);
    const missed = results.locator('.best-answers');
    await expect(missed).toContainText('Pairs you missed');
    await expect(missed.locator('li')).toHaveCount(total - 1);
  });

  test('finding every pair is perfect', async ({ page }) => {
    await page.goto('/swap-shop/');
    for (const key of solution.pairs) await enterWord(page, key.split('/')[0] as string);
    const results = page.getByRole('dialog', { name: 'Perfect!' });
    await expect(results).toContainText(`You found all ${total} pairs!`);
    await expectAccessible(page);
  });

  test('a hint shows how a word of a missing pair starts', async ({ page }) => {
    await page.goto('/swap-shop/');
    await page.getByRole('button', { name: 'Reveal a letter' }).click();
    await expect(page.locator('.hunt-hint-line')).toContainText('-letter word starting');
  });

  test('has a How to play page', async ({ page }) => {
    await page.goto('/swap-shop/how-to-play/');
    await expect(page.getByRole('heading', { level: 1, name: 'Swap Shop' })).toBeVisible();
    await expectAccessible(page);
  });
});
