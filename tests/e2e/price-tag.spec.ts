import { expect, test } from '@playwright/test';
import type { PriceTagPuzzle, PriceTagSolution } from '../../src/games/price-tag/spec.ts';
import { wordCost } from '../../src/games/price-tag/spec.ts';
import {
  enterWord,
  expectAccessible,
  expectNoHorizontalScroll,
  puzzleFor,
  setUp,
  WORDS,
} from './helpers.ts';

const DATE = '2026-10-08';
const { puzzle, solution } = puzzleFor<PriceTagPuzzle, PriceTagSolution>('price-tag', DATE);
const best = solution.answers[0] as string;
/** A valid, affordable word that isn't the optimum. */
const okWord = WORDS.find(
  (w) => w.length === 4 && wordCost(w, puzzle.prices) <= puzzle.budget,
) as string;
/** A valid word that's over budget. */
const dearWord = WORDS.find(
  (w) => w.length <= 6 && wordCost(w, puzzle.prices) > puzzle.budget,
) as string;

test.describe('Price Tag', () => {
  test('points to How to play on a first visit only', async ({ page }) => {
    await setUp(page, DATE);
    await page.goto('/price-tag/');
    const notice = page.getByText('New to Price Tag?');
    await expect(notice).toBeVisible();
    await page.getByRole('link', { name: 'Read how to play' }).click();
    await expect(page).toHaveURL(/\/price-tag\/how-to-play\/$/);
    await page.getByRole('link', { name: "Play today's puzzle" }).click();
    await expect(page.locator('.pt-budget-value')).toBeVisible();
    await expect(page.getByText('New to Price Tag?')).toBeHidden();
  });

  test('shows the budget and letter prices', async ({ page }) => {
    await setUp(page, DATE, { seenHelp: 'price-tag' });
    await page.goto('/price-tag/');
    await expect(page.getByText('#8 · Thursday 8 October 2026')).toBeVisible();
    await expect(page.locator('.pt-budget-value')).toHaveText(`${puzzle.budget}p`);
    await expect(page.getByRole('button', { name: `A, ${puzzle.prices[0]}p` })).toBeVisible();
    await expectAccessible(page);
    await expectNoHorizontalScroll(page);
  });

  test('validates words', async ({ page }) => {
    await setUp(page, DATE, { seenHelp: 'price-tag' });
    await page.goto('/price-tag/');
    const feedback = page.locator('.feedback');

    await enterWord(page, 'qz');
    await expect(feedback).toHaveText('Words need at least 3 letters.');

    await page.getByRole('textbox', { name: 'Your word' }).fill('');
    await enterWord(page, 'qzxq');
    await expect(feedback).toHaveText("QZXQ isn't in the word list.");

    await page.getByRole('textbox', { name: 'Your word' }).fill('');
    await enterWord(page, dearWord);
    await expect(feedback).toContainText('over budget');

    await page.getByRole('textbox', { name: 'Your word' }).fill('');
    await enterWord(page, okWord);
    await expect(feedback).toContainText(`${okWord.toUpperCase()}: 4 letters`);
    await expect(page.getByText('Words found: 1')).toBeVisible();

    await enterWord(page, okWord);
    await expect(feedback).toHaveText(`You've already found ${okWord.toUpperCase()}.`);
  });

  test('works with the on-screen keyboard', async ({ page }) => {
    await setUp(page, DATE, { seenHelp: 'price-tag' });
    await page.goto('/price-tag/');
    for (const letter of okWord) {
      await page
        .locator('.keyboard')
        .getByRole('button', { name: new RegExp(`^${letter.toUpperCase()},`) })
        .click();
    }
    await expect(page.locator('.live-line')).toHaveText(
      `${wordCost(okWord, puzzle.prices)}p · ${puzzle.budget - wordCost(okWord, puzzle.prices)}p left`,
    );
    await page.getByRole('button', { name: 'Enter' }).click();
    await expect(page.getByText('Words found: 1')).toBeVisible();
  });

  test('keeps progress across a reload', async ({ page }) => {
    await setUp(page, DATE, { seenHelp: 'price-tag' });
    await page.goto('/price-tag/');
    await enterWord(page, okWord);
    await expect(page.getByText('Words found: 1')).toBeVisible();
    await page.reload();
    await expect(page.getByText('Words found: 1')).toBeVisible();
  });

  test('finding the optimum ends the game with a perfect score', async ({
    page,
    context,
    browserName,
  }) => {
    // Playwright's WebKit can't grant clipboard access, so there we only check the toast.
    const canReadClipboard = browserName === 'chromium';
    if (canReadClipboard) await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await setUp(page, DATE, { seenHelp: 'price-tag' });
    await page.goto('/price-tag/');
    await enterWord(page, best);

    const results = page.getByRole('dialog', { name: 'Perfect!' });
    await expect(results).toBeVisible();
    await expect(results).toContainText('You found the best word');
    await expect(results.locator('.stat').first()).toContainText('1');
    await expectAccessible(page);

    await results.getByRole('button', { name: 'Share result' }).click();
    await expect(page.getByText('Result copied to clipboard')).toBeVisible();
    if (!canReadClipboard) return;
    const shared = await page.evaluate(() => navigator.clipboard.readText());
    expect(shared).toContain('Word Games · Price Tag #8');
    expect(shared).toContain('⭐');
    expect(shared.toLowerCase()).not.toContain(best); // spoiler-free
  });

  test('finishing early reveals the best answer', async ({ page }) => {
    await setUp(page, DATE, { seenHelp: 'price-tag' });
    await page.goto('/price-tag/');
    await enterWord(page, okWord);
    await page.getByRole('button', { name: 'Finish' }).click();
    await page.getByRole('button', { name: 'Finish and see answers' }).click();

    const results = page.getByRole('dialog', { name: 'Nice try' });
    await expect(results).toContainText("You didn't find the best word. Yours had 4 letters");
    await expect(results).toContainText(`the best has ${solution.bestLength} letters`);
    await expect(results.locator('.best-answers')).toContainText(best);

    // After closing, the board stays finished and can reopen the results.
    await results.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('textbox', { name: 'Your word' })).toBeHidden();
    await page.getByRole('button', { name: 'See results' }).click();
    await expect(page.getByRole('dialog', { name: 'Nice try' })).toBeVisible();
  });

  test('Finish reminds you to press Enter, naming a word typed but not entered', async ({
    page,
  }) => {
    await setUp(page, DATE, { seenHelp: 'price-tag' });
    await page.goto('/price-tag/');
    await expect(page.getByRole('textbox', { name: 'Your word' })).toBeEditable();
    await page.keyboard.type(okWord);
    await page.getByRole('button', { name: 'Finish' }).click();
    const dialog = page.getByRole('dialog', { name: 'Finish now?' });
    await expect(dialog).toContainText(`You haven't entered ${okWord.toUpperCase()} yet.`);
    await expect(dialog).toContainText('press Enter');

    // Keep playing returns to the game with the word still typed, ready to enter.
    await dialog.getByRole('button', { name: 'Keep playing' }).click();
    await expect(page.getByRole('textbox', { name: 'Your word' })).toHaveValue(okWord);
    await page.keyboard.press('Enter');
    await expect(page.getByText('Words found: 1')).toBeVisible();
  });

  test('plays an archive puzzle from the archive picker', async ({ page }) => {
    await setUp(page, DATE, { seenHelp: 'price-tag' });
    await page.goto('/price-tag/');
    await page.getByRole('button', { name: 'Archive' }).click();
    const archive = page.getByRole('dialog', { name: 'Archive' });
    await expect(archive).toBeVisible();
    await expectAccessible(page);
    await archive.getByRole('link', { name: /#2/ }).click();
    await expect(page).toHaveURL(/\?date=2026-10-02$/);
    await expect(page.getByText('#2 · Friday 2 October 2026')).toBeVisible();
    await expect(page.getByRole('link', { name: "Go to today's puzzle" })).toBeVisible();
  });

  test('ignores dates outside the archive', async ({ page }) => {
    await setUp(page, DATE, { seenHelp: 'price-tag' });
    await page.goto('/price-tag/?date=2027-01-01');
    await expect(page.getByText('#8 · Thursday 8 October 2026')).toBeVisible();
  });

  test('generates the puzzle in the browser when there is no file for the date', async ({
    page,
  }) => {
    await setUp(page, '2035-06-15', { seenHelp: 'price-tag' });
    await page.goto('/price-tag/');
    await expect(page.locator('.pt-budget-value')).toHaveText(/^\d+p$/);
    await expect(page.locator('.key-hint').first()).toHaveText(/^\dp$/);
  });

  test('still works when localStorage is unavailable', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('Blocked', 'SecurityError');
        },
      });
    });
    await setUp(page, DATE);
    await page.goto('/price-tag/');
    await enterWord(page, okWord);
    await expect(page.getByText('Words found: 1')).toBeVisible();
  });

  test('is accessible in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await setUp(page, DATE, { seenHelp: 'price-tag' });
    await page.goto('/price-tag/');
    await enterWord(page, okWord);
    await expect(page.getByText('Words found: 1')).toBeVisible();
    await expectAccessible(page);
  });
});
