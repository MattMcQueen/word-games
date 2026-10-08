import { expect, test } from '@playwright/test';
import type { ThreaderPuzzle, ThreaderSolution } from '../../src/games/threader/spec.ts';
import { containsInOrder } from '../../src/solvers/letters.ts';
import {
  enterWord,
  expectAccessible,
  expectNoHorizontalScroll,
  puzzleFor,
  setUp,
  WORDS,
} from './helpers.ts';

const DATE = '2026-10-08';
const { puzzle, solution } = puzzleFor<ThreaderPuzzle, ThreaderSolution>('threader', DATE);
const thread = puzzle.letters;
const best = solution.answers[0] as string;
/** A valid word containing the thread that isn't one of the shortest. */
const longer = WORDS.find(
  (w) => w.length === solution.bestLength + 2 && containsInOrder(w, thread),
) as string;
/** A valid word that has the letters but not in order. */
const wrongOrder = WORDS.find(
  (w) => w.length <= 8 && [...thread].every((c) => w.includes(c)) && !containsInOrder(w, thread),
) as string;

test.beforeEach(async ({ page }) => {
  await page.route(/ko-fi\.com/, (route) => route.abort());
  await setUp(page, DATE, { seenHelp: 'threader' });
});

test.describe('Threader', () => {
  test('shows the thread and marks its letters on the keyboard', async ({ page }) => {
    await page.goto('/threader/');
    const spoken = [...thread.toUpperCase()].join(', then ');
    await expect(page.locator('.th-thread')).toContainText(spoken);
    const first = thread[0]?.toUpperCase() as string;
    await expect(page.getByRole('button', { name: new RegExp(`^${first}, 1st`) })).toBeVisible();
    await expectAccessible(page);
    await expectNoHorizontalScroll(page);
  });

  test('rejects words without the thread in order', async ({ page }) => {
    await page.goto('/threader/');
    await enterWord(page, wrongOrder);
    await expect(page.locator('.feedback')).toContainText('in that order');
  });

  test('previews the thread while typing', async ({ page }) => {
    await page.goto('/threader/');
    await expect(page.getByRole('textbox', { name: 'Your word' })).toBeEditable();
    await page.keyboard.type(longer);
    await expect(page.locator('.live-line')).toContainText('✓ all in order');
    await expect(page.locator('.th-hit')).toHaveCount(thread.length);
  });

  test('keeps the shortest word as the best and finishes on the optimum', async ({ page }) => {
    await page.goto('/threader/');
    await enterWord(page, longer);
    await expect(page.locator('.best-line')).toContainText(
      `Your shortest: ${longer.toUpperCase()}`,
    );

    await enterWord(page, best);
    const results = page.getByRole('dialog', { name: 'Perfect!' });
    await expect(results).toContainText('the best possible!');
    await expectAccessible(page);
  });

  test('finishing early shows every shortest answer', async ({ page }) => {
    await page.goto('/threader/');
    await enterWord(page, longer);
    await page.getByRole('button', { name: 'Finish' }).click();
    await page.getByRole('button', { name: 'Finish and see answers' }).click();
    const results = page.getByRole('dialog', { name: 'Nice try' });
    await expect(results).toContainText(`the shortest possible was ${solution.bestLength} letters`);
    for (const answer of solution.answers) {
      await expect(results.locator('.best-answers')).toContainText(answer);
    }
  });

  test('has a How to play page', async ({ page }) => {
    await page.goto('/threader/how-to-play/');
    await expect(page.getByRole('heading', { level: 1, name: 'Threader' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Missed a day?' })).toBeVisible();
    await expectAccessible(page);
  });

  test('is listed on the home page', async ({ page }) => {
    await page.goto('/');
    const card = page.getByRole('listitem').filter({ hasText: 'Threader' });
    await card.getByRole('link', { name: 'Play', exact: true }).click();
    await expect(page).toHaveURL(/\/threader\/$/);
  });
});
