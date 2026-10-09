import { expect, test } from '@playwright/test';
import type { RetitledPuzzle, RetitledSolution } from '../../src/games/retitled/spec.ts';
import {
  enterWord,
  expectAccessible,
  expectNoHorizontalScroll,
  puzzleFor,
  setUp,
} from './helpers.ts';

const DATE = '2026-10-08';
const { puzzle, solution } = puzzleFor<RetitledPuzzle, RetitledSolution>('retitled', DATE);
const open = solution.words.filter((_w, i) => !puzzle.given[i]);
const first = open[0] as string;

test.beforeEach(async ({ page }) => {
  await page.route(/ko-fi\.com/, (route) => route.abort());
  await setUp(page, DATE, { seenHelp: 'retitled' });
});

test.describe('Retitled', () => {
  test('shows the reworded title and a box per letter of the real one', async ({ page }) => {
    await page.goto('/retitled/');
    await expect(page.locator('.rt-clue')).toHaveText(`“${puzzle.clue}”`);
    const words = page.getByRole('list', { name: 'The title' }).getByRole('listitem');
    await expect(words).toHaveCount(solution.words.length);
    await expect(page.locator('.rt-box')).toHaveCount(solution.words.join('').length);
    await expect(page.locator('.tb-byline')).not.toContainText(solution.author);
    await expectAccessible(page);
    await expectNoHorizontalScroll(page);
  });

  test('a right word goes into place', async ({ page }) => {
    await page.goto('/retitled/');
    await enterWord(page, first);
    await expect(page.locator('.feedback')).toHaveText(`${first.toUpperCase()} is in place.`);
    await expect(page.locator('.rt-done').first()).toBeVisible();
  });

  test('a revealed letter fills the first box of a word', async ({ page }) => {
    await page.goto('/retitled/');
    await page.getByRole('button', { name: 'Reveal a letter' }).click();
    await expect(page.locator('.rt-word:not(.rt-done) .rt-shown').first()).toHaveText(
      first[0]?.toUpperCase() as string,
    );
  });

  test('typing the whole title is perfect, and offers the book on Amazon', async ({ page }) => {
    await page.goto('/retitled/');
    await enterWord(page, solution.words.join(''));
    const results = page.getByRole('dialog', { name: 'Perfect!' });
    await expect(results).toContainText('without a single hint!');
    await expect(results).toContainText(`was ${solution.title} by ${solution.author}`);
    const buy = results.getByRole('link', { name: /on Amazon/ });
    await expect(buy).toHaveAttribute('href', /amazon\.co\.uk\/s\?.*tag=matsbasblo-21/);
    await expectAccessible(page);
  });

  test('has a How to play page', async ({ page }) => {
    await page.goto('/retitled/how-to-play/');
    await expect(page.getByRole('heading', { level: 1, name: 'Retitled' })).toBeVisible();
    await expectAccessible(page);
  });
});
