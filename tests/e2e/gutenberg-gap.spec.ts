import { expect, test } from '@playwright/test';
import type {
  GutenbergGapPuzzle,
  GutenbergGapSolution,
} from '../../src/games/gutenberg-gap/spec.ts';
import {
  enterWord,
  expectAccessible,
  expectNoHorizontalScroll,
  puzzleFor,
  setUp,
  WORDS,
} from './helpers.ts';

const DATE = '2026-10-08';
const { puzzle, solution } = puzzleFor<GutenbergGapPuzzle, GutenbergGapSolution>(
  'gutenberg-gap',
  DATE,
);
const answer = solution.word;
/** A wrong guess of the right length. */
const wrong = WORDS.find((w) => w.length === puzzle.length && w !== answer) as string;

test.beforeEach(async ({ page }) => {
  await page.route(/ko-fi\.com/, (route) => route.abort());
  await setUp(page, DATE, { seenHelp: 'gutenberg-gap' });
});

test.describe('Gutenberg Gap', () => {
  test('shows the sentence with a blank for each letter, and no credit yet', async ({ page }) => {
    await page.goto('/gutenberg-gap/');
    await expect(page.locator('.gg-sentence')).toContainText(puzzle.before.trim());
    await expect(page.locator('.gg-box')).toHaveCount(puzzle.length);
    await expect(page.locator('.gg-sentence')).toContainText(
      `missing word, ${puzzle.length} letters`,
    );
    await expect(page.locator('.gg-credit')).toBeHidden();
    await expectAccessible(page);
    await expectNoHorizontalScroll(page);
  });

  test('rejects guesses of the wrong length', async ({ page }) => {
    await page.goto('/gutenberg-gap/');
    await enterWord(page, 'cat');
    await expect(page.locator('.feedback')).toHaveText(
      `The missing word has ${puzzle.length} letters.`,
    );
  });

  test('a wrong guess reveals a letter', async ({ page }) => {
    await page.goto('/gutenberg-gap/');
    await enterWord(page, wrong);
    await expect(page.locator('.feedback')).toContainText("Here's another letter.");
    const position = puzzle.reveal[0] as number;
    await expect(page.locator('.gg-box').nth(position)).toHaveText(
      (answer[position] as string).toUpperCase(),
    );
    await expect(page.locator('.live-line')).toContainText(`${puzzle.length - 1} guesses left`);
  });

  test('several wrong guesses each count, even if they ignore the letters shown', async ({
    page,
  }) => {
    await page.goto('/gutenberg-gap/');
    const others = WORDS.filter((w) => w.length === puzzle.length && w !== answer).slice(0, 3);
    for (const [i, guess] of others.entries()) {
      await enterWord(page, guess);
      await expect(page.locator('.feedback')).toContainText(`Not ${guess.toUpperCase()}.`);
      await expect(page.locator('.live-line')).toContainText(
        `${puzzle.length - i - 1} guesses left`,
      );
    }
    await expect(page.getByText('Your guesses: 3')).toBeVisible();
  });

  test('guessing first time is perfect and credits the book', async ({ page }) => {
    await page.goto('/gutenberg-gap/');
    await enterWord(page, answer);
    const results = page.getByRole('dialog', { name: 'Perfect!' });
    await expect(results).toContainText('You got it in one!');
    await expect(results).toContainText(`From ${puzzle.book.title} by ${puzzle.book.author}`);
    await expectAccessible(page);
    await results.getByRole('button', { name: 'Close' }).click();
    await expect(page.locator('.gg-credit')).toContainText(puzzle.book.title);
    await expect(page.locator('.gg-sentence')).toContainText(answer);
  });

  test('giving up shows the word', async ({ page }) => {
    await page.goto('/gutenberg-gap/');
    await page.getByRole('button', { name: 'Finish' }).click();
    await page.getByRole('button', { name: 'Finish and see answers' }).click();
    const results = page.getByRole('dialog', { name: 'Better luck next time' });
    await expect(results).toContainText(`The missing word was ${answer.toUpperCase()}.`);
  });

  test('has a How to play page, and the books are credited on About', async ({ page }) => {
    await page.goto('/gutenberg-gap/how-to-play/');
    await expect(page.getByRole('heading', { level: 1, name: 'Gutenberg Gap' })).toBeVisible();
    await expectAccessible(page);
    await page.goto('/about/');
    await expect(page.getByRole('link', { name: 'Pride and Prejudice' })).toHaveAttribute(
      'href',
      'https://www.gutenberg.org/ebooks/1342',
    );
  });

  test('generates a puzzle in the browser beyond the pre-generated range', async ({ page }) => {
    await setUp(page, '2035-06-15', { seenHelp: 'gutenberg-gap' });
    const bank = page.waitForResponse('**/data/sentences.json');
    await page.goto('/gutenberg-gap/');
    expect((await bank).ok()).toBe(true);
    await expect(page.locator('.gg-box').first()).toBeVisible();
  });
});
