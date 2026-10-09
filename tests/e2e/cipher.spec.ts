import { expect, type Page, test } from '@playwright/test';
import {
  type CipherPuzzle,
  type CipherSolution,
  codeLetters,
} from '../../src/games/cipher/spec.ts';
import { expectAccessible, expectNoHorizontalScroll, puzzleFor, setUp } from './helpers.ts';

const DATE = '2026-10-08';
const { puzzle, solution } = puzzleFor<CipherPuzzle, CipherSolution>('cipher', DATE);
/** The coded letters in reading order, one per button. */
const letters = [...puzzle.coded].filter((ch) => ch >= 'a' && ch <= 'z');
const codes = codeLetters(puzzle.coded);
const first = codes[0] as string;

const cells = (page: Page) =>
  page.getByRole('group', { name: 'The coded line' }).getByRole('button');

/** Choose the first copy of a code letter and type a letter for it. */
async function place(page: Page, code: string, letter: string) {
  await cells(page).nth(letters.indexOf(code)).click();
  await page.keyboard.press(letter);
}

test.beforeEach(async ({ page }) => {
  await page.route(/ko-fi\.com/, (route) => route.abort());
  await setUp(page, DATE, { seenHelp: 'cipher' });
});

test.describe('Cipher', () => {
  test('shows the coded line, a button per letter', async ({ page }) => {
    await page.goto('/cipher/');
    await expect(cells(page)).toHaveCount(letters.length);
    await expect(page.locator('.cp-status')).toHaveText(`${first.toUpperCase()} stands for ?`);
    await expectAccessible(page);
    await expectNoHorizontalScroll(page);
  });

  test('typing a letter fills every copy of the code letter, then moves on', async ({ page }) => {
    await page.goto('/cipher/');
    const real = solution.key[first] as string;
    await place(page, first, real);
    const copies = letters.filter((ch) => ch === first).length;
    await expect(page.locator('.cp-guess').filter({ hasText: real.toUpperCase() })).toHaveCount(
      copies,
    );
    await expect(page.locator('.feedback')).toHaveText(
      `${first.toUpperCase()} is now ${real.toUpperCase()}.`,
    );
    await expect(page.locator('.cp-status')).toHaveText(`${codes[1]?.toUpperCase()} stands for ?`);
    // The on-screen keyboard ticks letters in use.
    await expect(page.getByRole('button', { name: `${real.toUpperCase()}, ✓` })).toBeVisible();
  });

  test('the arrow keys move along the line', async ({ page }) => {
    await page.goto('/cipher/');
    await cells(page).first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(cells(page).nth(1)).toBeFocused();
    await expect(page.locator('.cp-status')).toContainText(
      `${letters[1]?.toUpperCase()} stands for`,
    );
  });

  test("a full but wrong code says how many letters aren't right", async ({ page }) => {
    test.slow(); // about twenty taps and key presses: slow on WebKit when the machine is busy
    await page.goto('/cipher/');
    // Every letter right except the first two, swapped.
    const [a, b] = codes as [string, string];
    for (const code of codes.slice(2)) await place(page, code, solution.key[code] as string);
    await place(page, a, solution.key[b] as string);
    await place(page, b, solution.key[a] as string);
    await expect(page.locator('.feedback')).toHaveText(
      "Every letter is placed, but 2 letters aren't right yet.",
    );
  });

  test('a hint gives away the chosen letter', async ({ page }) => {
    await page.goto('/cipher/');
    await cells(page).first().click();
    await page.getByRole('button', { name: 'Reveal a letter' }).click();
    await expect(cells(page).first()).toHaveClass(/cp-given/);
    await expect(cells(page).first()).toContainText(solution.key[first]?.toUpperCase() as string);
  });

  test('cracking it without hints is perfect, and credits the book', async ({ page }) => {
    test.slow(); // about twenty taps and key presses: slow on WebKit when the machine is busy
    await page.goto('/cipher/');
    for (const code of codes) await place(page, code, solution.key[code] as string);
    const results = page.getByRole('dialog', { name: 'Perfect!' });
    await expect(results).toContainText('without a single hint!');
    await expect(results).toContainText(`From ${puzzle.book.title} by ${puzzle.book.author}`);
    const buy = results.getByRole('link', { name: /on Amazon/ });
    await expect(buy).toHaveAttribute('href', /amazon\.co\.uk\/s\?.*tag=matsbasblo-21/);
    await expectAccessible(page);
  });

  test('has a How to play page', async ({ page }) => {
    await page.goto('/cipher/how-to-play/');
    await expect(page.getByRole('heading', { level: 1, name: 'Cipher' })).toBeVisible();
    await expectAccessible(page);
  });
});
