import { expect, test } from '@playwright/test';
import type { HingePuzzle, HingeSolution } from '../../src/games/hinge/spec.ts';
import {
  enterWord,
  expectAccessible,
  expectNoHorizontalScroll,
  puzzleFor,
  setUp,
} from './helpers.ts';

const DATE = '2026-10-08';
const { puzzle, solution } = puzzleFor<HingePuzzle, HingeSolution>('hinge', DATE);
const [first = ''] = solution.answers;

test.beforeEach(async ({ page }) => {
  await page.route(/ko-fi\.com/, (route) => route.abort());
  await setUp(page, DATE, { seenHelp: 'hinge' });
});

test.describe('Hinge', () => {
  test('shows five pairs with a box for each letter of their hinge', async ({ page }) => {
    await page.goto('/hinge/');
    const pairs = page.locator('.hg-pair');
    await expect(pairs).toHaveCount(puzzle.pairs.length);
    for (const [i, pair] of puzzle.pairs.entries()) {
      await expect(pairs.nth(i)).toContainText(pair.left.toUpperCase());
      await expect(pairs.nth(i).locator('.hg-box')).toHaveCount(pair.length);
    }
    await expectAccessible(page);
    await expectNoHorizontalScroll(page);
  });

  test('a right word fills its pair, wherever it is in the list', async ({ page }) => {
    await page.goto('/hinge/');
    const last = puzzle.pairs.length - 1;
    const answer = solution.answers[last] as string;
    await enterWord(page, answer);
    const row = page.locator('.hg-pair').nth(last);
    await expect(row.locator('.hg-made')).toContainText(
      `${(puzzle.pairs[last]?.left + answer).toUpperCase()}`,
    );
    await expect(page.locator('.found-heading')).toHaveText(
      `Hinges found: 1 of ${puzzle.pairs.length}`,
    );
  });

  test('wrong words are explained', async ({ page }) => {
    await page.goto('/hinge/');
    await enterWord(page, 'zebra');
    await expect(page.locator('.feedback')).toHaveText("ZEBRA doesn't hinge any of today's pairs.");
  });

  test('revealing a letter shows it, and a hinted day is not perfect', async ({ page }) => {
    await page.goto('/hinge/');
    await page.getByRole('button', { name: 'Reveal a letter of hinge 1' }).click();
    await expect(page.locator('.hg-pair').first().locator('.hg-box').first()).toHaveText(
      (first[0] as string).toUpperCase(),
    );
    for (const answer of solution.answers) await enterWord(page, answer);
    const results = page.getByRole('dialog', { name: 'Well played' });
    await expect(results).toContainText('with 1 letter revealed');
  });

  test('finding all five unaided is perfect', async ({ page }) => {
    await page.goto('/hinge/');
    for (const answer of solution.answers) await enterWord(page, answer);
    const results = page.getByRole('dialog', { name: 'Perfect!' });
    await expect(results).toContainText('without a single hint!');
    await expectAccessible(page);
  });

  test('has a How to play page', async ({ page }) => {
    await page.goto('/hinge/how-to-play/');
    await expect(page.getByRole('heading', { level: 1, name: 'Hinge' })).toBeVisible();
    await expectAccessible(page);
  });
});
