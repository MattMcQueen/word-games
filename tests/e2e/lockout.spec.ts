import { expect, test } from '@playwright/test';
import {
  isAllowed,
  type LockoutPuzzle,
  type LockoutSolution,
} from '../../src/games/lockout/spec.ts';
import {
  enterWord,
  expectAccessible,
  expectNoHorizontalScroll,
  puzzleFor,
  setUp,
  WORDS,
} from './helpers.ts';

const DATE = '2026-10-08';
const { puzzle, solution } = puzzleFor<LockoutPuzzle, LockoutSolution>('lockout', DATE);
const R = puzzle.required.toUpperCase();
const best = solution.answers[0] as string;
const shorter = WORDS.find((w) => isAllowed(w, puzzle) && w.length < solution.bestLength) as string;
const noRequired = WORDS.find(
  (w) =>
    w.length >= 4 &&
    !w.includes(puzzle.required) &&
    [...w].every((c) => !puzzle.banned.includes(c)),
) as string;

test.beforeEach(async ({ page }) => {
  await page.route(/ko-fi\.com/, (route) => route.abort());
  await setUp(page, DATE, { seenHelp: 'lockout' });
});

test.describe('Lockout', () => {
  test('shows the letters and switches off the locked keys', async ({ page }) => {
    await page.goto('/lockout/');
    await expect(page.locator('.lo-required')).toHaveText(R);
    await expect(page.locator('.lo-banned')).toHaveCount(puzzle.banned.length);
    const locked = (puzzle.banned[0] as string).toUpperCase();
    await expect(page.getByRole('button', { name: `${locked}, out` })).toBeDisabled();
    await expect(page.getByRole('button', { name: `${R}, must` })).toBeEnabled();
    await expectAccessible(page);
    await expectNoHorizontalScroll(page);
  });

  test('locked letters cannot be typed', async ({ page }) => {
    await page.goto('/lockout/');
    await expect(page.getByRole('textbox', { name: 'Your word' })).toBeEditable();
    await page.keyboard.type(puzzle.banned[0] as string);
    await expect(page.getByRole('textbox', { name: 'Your word' })).toHaveValue('');
  });

  test('words without the required letter are rejected', async ({ page }) => {
    await page.goto('/lockout/');
    await enterWord(page, noRequired);
    await expect(page.locator('.feedback')).toHaveText(`Words must include ${R}.`);
  });

  test('keeps the longest word and finishes on the longest possible', async ({ page }) => {
    await page.goto('/lockout/');
    await enterWord(page, shorter);
    await expect(page.locator('.best-line')).toContainText(
      `Your longest: ${shorter.toUpperCase()}`,
    );
    await enterWord(page, best);
    await expect(page.getByRole('dialog', { name: 'Perfect!' })).toContainText(
      'the best possible!',
    );
    await expectAccessible(page);
  });

  test('has a How to play page', async ({ page }) => {
    await page.goto('/lockout/how-to-play/');
    await expect(page.getByRole('heading', { level: 1, name: 'Lockout' })).toBeVisible();
    await expectAccessible(page);
  });
});
