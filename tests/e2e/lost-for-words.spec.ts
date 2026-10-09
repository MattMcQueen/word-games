import { expect, test } from '@playwright/test';
import type {
  LostForWordsPuzzle,
  LostForWordsSolution,
} from '../../src/games/lost-for-words/spec.ts';
import {
  enterWord,
  expectAccessible,
  expectNoHorizontalScroll,
  puzzleFor,
  setUp,
  WORDS,
} from './helpers.ts';

const DATE = '2026-10-08';
const { puzzle, solution } = puzzleFor<LostForWordsPuzzle, LostForWordsSolution>(
  'lost-for-words',
  DATE,
);
const answer = solution.word;
/** A wrong guess of the right length. */
const wrong = WORDS.find((w) => w.length === puzzle.length && w !== answer) as string;

test.beforeEach(async ({ page }) => {
  await page.route(/ko-fi\.com/, (route) => route.abort());
  await setUp(page, DATE, { seenHelp: 'lost-for-words' });
});

test.describe('Lost for Words', () => {
  test('shows the sentence with a blank for each letter, and no credit yet', async ({ page }) => {
    await page.goto('/lost-for-words/');
    await expect(page.locator('.lw-sentence')).toContainText(puzzle.before.trim());
    await expect(page.locator('.lw-box')).toHaveCount(puzzle.length);
    await expect(page.locator('.lw-sentence')).toContainText(
      `missing word, ${puzzle.length} letters`,
    );
    await expect(page.locator('.lw-credit')).toBeHidden();
    await expectAccessible(page);
    await expectNoHorizontalScroll(page);
  });

  test('rejects guesses of the wrong length', async ({ page }) => {
    await page.goto('/lost-for-words/');
    await enterWord(page, 'cat');
    await expect(page.locator('.feedback')).toHaveText(
      `The missing word has ${puzzle.length} letters.`,
    );
  });

  test('a wrong guess reveals a letter', async ({ page }) => {
    await page.goto('/lost-for-words/');
    await enterWord(page, wrong);
    await expect(page.locator('.feedback')).toContainText("Here's another letter.");
    const position = puzzle.reveal[0] as number;
    await expect(page.locator('.lw-box').nth(position)).toHaveText(
      (answer[position] as string).toUpperCase(),
    );
    await expect(page.locator('.live-line')).toContainText(`${puzzle.length - 1} guesses left`);
  });

  test('several wrong guesses each count, even if they ignore the letters shown', async ({
    page,
  }) => {
    await page.goto('/lost-for-words/');
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
    await page.goto('/lost-for-words/');
    await enterWord(page, answer);
    const results = page.getByRole('dialog', { name: 'Perfect!' });
    await expect(results).toContainText('You got it in one!');
    await expect(results).toContainText(`From ${puzzle.book.title} by ${puzzle.book.author}`);
    await expectAccessible(page);
    await results.getByRole('button', { name: 'Close' }).click();
    await expect(results).toBeHidden();
    // The board's own credit (the results dialog has a copy too).
    const credit = page.getByRole('region', { name: 'The sentence' }).locator('.lw-credit');
    await expect(credit).toContainText(puzzle.book.title);
    const buy = credit.getByRole('link', { name: /on Amazon/ });
    await expect(buy).toHaveAttribute('href', /amazon\.co\.uk\/s\?.*tag=matsbasblo-21/);
    await expect(buy).toHaveAttribute('rel', /sponsored/);
    await expect(credit).toContainText('As an Amazon Associate');
    await expect(page.locator('.lw-sentence')).toContainText(answer);
  });

  test('giving up shows the word', async ({ page }) => {
    await page.goto('/lost-for-words/');
    await page.getByRole('button', { name: 'Finish' }).click();
    await page.getByRole('button', { name: 'Finish and see answers' }).click();
    const results = page.getByRole('dialog', { name: 'Better luck next time' });
    await expect(results).toContainText(`The missing word was ${answer.toUpperCase()}.`);
  });

  test('has a How to play page, and the books are credited on About', async ({ page }) => {
    await page.goto('/lost-for-words/how-to-play/');
    await expect(page.getByRole('heading', { level: 1, name: 'Lost for Words' })).toBeVisible();
    await expectAccessible(page);
    await page.goto('/about/');
    await expect(page.locator('#books')).toContainText('Pride and Prejudice by Jane Austen');
    await expect(page.locator('#privacy')).toContainText(
      'As an Amazon Associate I earn from qualifying purchases.',
    );
  });

  test('generates a puzzle in the browser beyond the pre-generated range', async ({ page }) => {
    await setUp(page, '2035-06-15', { seenHelp: 'lost-for-words' });
    const bank = page.waitForResponse('**/data/sentences.json');
    await page.goto('/lost-for-words/');
    expect((await bank).ok()).toBe(true);
    await expect(page.locator('.lw-box').first()).toBeVisible();
  });
});
