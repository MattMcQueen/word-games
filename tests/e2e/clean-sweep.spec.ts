import { expect, test } from '@playwright/test';
import type { CleanSweepPuzzle, CleanSweepSolution } from '../../src/games/clean-sweep/spec.ts';
import {
  enterWord,
  expectAccessible,
  expectNoHorizontalScroll,
  puzzleFor,
  setUp,
} from './helpers.ts';

const DATE = '2026-10-08';
const { puzzle, solution } = puzzleFor<CleanSweepPuzzle, CleanSweepSolution>('clean-sweep', DATE);
const best = solution.examples[0] as string[];
const [first = '', ...rest] = best;
const missing = [...'abcdefghijklmnopqrstuvwxyz'].find(
  (c) => !puzzle.letters.includes(c),
) as string;

test.beforeEach(async ({ page }) => {
  await page.route(/ko-fi\.com/, (route) => route.abort());
  await setUp(page, DATE, { seenHelp: 'clean-sweep' });
});

test.describe('Clean Sweep', () => {
  test('shows the letters and only offers those on the keyboard', async ({ page }) => {
    await page.goto('/clean-sweep/');
    const tiles = page.getByRole('list', { name: 'Letters' }).getByRole('listitem');
    await expect(tiles).toHaveCount(puzzle.letters.length);
    await expect(page.locator('.cs-status')).toHaveText(`${puzzle.letters.length} letters left`);
    await expect(
      page.getByRole('button', { name: missing.toUpperCase(), exact: true }),
    ).toBeDisabled();
    await expectAccessible(page);
    await expectNoHorizontalScroll(page);
  });

  test('placing a word crosses off its letters, and taking it back returns them', async ({
    page,
  }) => {
    await page.goto('/clean-sweep/');
    await enterWord(page, first);
    const left = puzzle.letters.length - first.length;
    await expect(page.locator('.cs-status')).toHaveText(`${left} letters left`);
    await expect(page.locator('.cs-used')).toHaveCount(first.length);

    await page.getByRole('button', { name: `Take back ${first.toUpperCase()}` }).click();
    await expect(page.locator('.cs-status')).toHaveText(`${puzzle.letters.length} letters left`);
    await expect(page.locator('.cs-used')).toHaveCount(0);
  });

  test('sweeping in the fewest words is perfect', async ({ page }) => {
    await page.goto('/clean-sweep/');
    await enterWord(page, first);
    for (const word of rest) await enterWord(page, word);
    const results = page.getByRole('dialog', { name: 'Perfect!' });
    await expect(results).toContainText('the fewest possible!');
    await expectAccessible(page);
  });

  test('finishing early shows some best sweeps', async ({ page }) => {
    await page.goto('/clean-sweep/');
    await enterWord(page, first);
    await page.getByRole('button', { name: 'Finish' }).click();
    await page.getByRole('button', { name: 'Finish and see answers' }).click();
    const results = page.getByRole('dialog', { name: 'Better luck next time' });
    await expect(results).toContainText(`it can be done in ${solution.min} words`);
    await expect(results.locator('.best-answers')).toContainText(best.join(' + ').toUpperCase());
  });

  test('has a How to play page', async ({ page }) => {
    await page.goto('/clean-sweep/how-to-play/');
    await expect(page.getByRole('heading', { level: 1, name: 'Clean Sweep' })).toBeVisible();
    await expectAccessible(page);
  });
});
