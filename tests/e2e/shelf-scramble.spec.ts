import { expect, test } from '@playwright/test';
import type {
  ShelfScramblePuzzle,
  ShelfScrambleSolution,
} from '../../src/games/shelf-scramble/spec.ts';
import {
  enterWord,
  expectAccessible,
  expectNoHorizontalScroll,
  puzzleFor,
  setUp,
} from './helpers.ts';

const DATE = '2026-10-08';
const { puzzle, solution } = puzzleFor<ShelfScramblePuzzle, ShelfScrambleSolution>(
  'shelf-scramble',
  DATE,
);
const longest = [...solution.words].sort((a, b) => b.length - a.length)[0] as string;

test.beforeEach(async ({ page }) => {
  await page.route(/ko-fi\.com/, (route) => route.abort());
  await setUp(page, DATE, { seenHelp: 'shelf-scramble' });
});

test.describe('Shelf Scramble', () => {
  test('shows each word of the title jumbled, and hides the author', async ({ page }) => {
    await page.goto('/shelf-scramble/');
    const words = page.getByRole('list', { name: 'The title' }).getByRole('listitem');
    await expect(words).toHaveCount(puzzle.tiles.length);
    await expect(page.locator('.tb-byline')).not.toContainText(solution.author);
    await expectAccessible(page);
    await expectNoHorizontalScroll(page);
  });

  test('a right word goes into place', async ({ page }) => {
    await page.goto('/shelf-scramble/');
    await enterWord(page, longest);
    await expect(page.locator('.feedback')).toHaveText(`${longest.toUpperCase()} is in place.`);
    await expect(page.locator('.ss2-done').first()).toContainText(
      [...longest.toUpperCase()].join(''),
    );
  });

  test('the author can be shown as a hint', async ({ page }) => {
    await page.goto('/shelf-scramble/');
    await page.getByRole('button', { name: 'Show the author' }).click();
    await expect(page.locator('.tb-byline')).toHaveText(`By ${solution.author}`);
    await expect(page.getByRole('button', { name: 'Show the author' })).toBeDisabled();
  });

  test('typing the whole title is perfect, and offers the book on Amazon', async ({ page }) => {
    await page.goto('/shelf-scramble/');
    await enterWord(page, solution.words.join(''));
    const results = page.getByRole('dialog', { name: 'Perfect!' });
    await expect(results).toContainText('without a single hint!');
    await expect(results).toContainText(`${solution.title} by ${solution.author}`);
    const buy = results.getByRole('link', { name: /on Amazon/ });
    await expect(buy).toHaveAttribute('href', /amazon\.co\.uk\/s\?.*tag=matsbasblo-21/);
    await expect(results).toContainText('As an Amazon Associate');
    await expectAccessible(page);
  });

  test('has a How to play page', async ({ page }) => {
    await page.goto('/shelf-scramble/how-to-play/');
    await expect(page.getByRole('heading', { level: 1, name: 'Shelf Scramble' })).toBeVisible();
    await expectAccessible(page);
  });
});
