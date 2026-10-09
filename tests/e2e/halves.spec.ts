import { expect, type Page, test } from '@playwright/test';
import type { HalvesPuzzle, HalvesSolution } from '../../src/games/halves/spec.ts';
import { expectAccessible, expectNoHorizontalScroll, puzzleFor, setUp } from './helpers.ts';

const DATE = '2026-10-08';
const { puzzle, solution } = puzzleFor<HalvesPuzzle, HalvesSolution>('halves', DATE);

const tile = (page: Page, half: string) =>
  page
    .getByRole('group', { name: 'Halves to join' })
    .getByRole('button', { name: half.toUpperCase(), exact: true });

async function join(page: Page, a: string, b: string) {
  await tile(page, a).click();
  await tile(page, b).click();
}

test.beforeEach(async ({ page }) => {
  await page.route(/ko-fi\.com/, (route) => route.abort());
  await setUp(page, DATE, { seenHelp: 'halves' });
});

test.describe('Halves', () => {
  test('shows the twelve halves as buttons', async ({ page }) => {
    await page.goto('/halves/');
    const tiles = page.getByRole('group', { name: 'Halves to join' }).getByRole('button');
    await expect(tiles).toHaveCount(puzzle.halves.length);
    await expect(page.locator('.hv-progress')).toHaveText('6 words to go · 0 mistakes');
    await expectAccessible(page);
    await expectNoHorizontalScroll(page);
  });

  test('picking a half marks it, and picking it again puts it back', async ({ page }) => {
    await page.goto('/halves/');
    const first = puzzle.halves[0] as string;
    await tile(page, first).click();
    await expect(tile(page, first)).toHaveAttribute('aria-pressed', 'true');
    await tile(page, first).click();
    await expect(tile(page, first)).toHaveAttribute('aria-pressed', 'false');
  });

  test('a right pair joins in either order and leaves the board', async ({ page }) => {
    await page.goto('/halves/');
    const [a, b] = solution.words[0] as [string, string];
    await join(page, b, a);
    await expect(page.locator('.feedback')).toHaveText(
      `${(a + b).toUpperCase()}: ${a.toUpperCase()} + ${b.toUpperCase()}.`,
    );
    await expect(tile(page, a)).toBeHidden();
    await expect(page.locator('.found-list')).toContainText(new RegExp(a + b, 'i'));
    await expect(page.locator('.found-heading')).toHaveText('Joined: 1 of 6');
  });

  test('a wrong pair counts as a mistake', async ({ page }) => {
    await page.goto('/halves/');
    const a = solution.words[0]?.[0] as string;
    const b = solution.words[1]?.[0] as string;
    await join(page, a, b);
    await expect(page.locator('.feedback')).toHaveAttribute('data-kind', 'bad');
    await expect(page.locator('.hv-progress')).toHaveText('6 words to go · 1 mistake');
    // The same pair again isn't counted twice.
    await join(page, b, a);
    await expect(page.locator('.feedback')).toContainText("You've already tried");
    await expect(page.locator('.hv-progress')).toHaveText('6 words to go · 1 mistake');
  });

  test('joining all six without a mistake is perfect', async ({ page }) => {
    await page.goto('/halves/');
    // The last pair joins on its own.
    for (const [a, b] of solution.words.slice(0, 5)) await join(page, a, b);
    const results = page.getByRole('dialog', { name: 'Perfect!' });
    await expect(results).toContainText('without a single mistake!');
    await expect(results).toContainText(solution.words[5]?.join('') as string);
    // Then on to the next of today's games.
    await expect(results.getByRole('link', { name: 'Play Retitled' })).toHaveAttribute(
      'href',
      '/retitled/',
    );
    await expectAccessible(page);
  });

  test('works from the keyboard', async ({ page }) => {
    await page.goto('/halves/');
    const [a, b] = solution.words[0] as [string, string];
    await tile(page, a).focus();
    await page.keyboard.press('Enter');
    await tile(page, b).focus();
    await page.keyboard.press('Space');
    await expect(page.locator('.found-heading')).toHaveText('Joined: 1 of 6');
    // Focus moves on to a half that's still there.
    await expect
      .poll(() =>
        page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          return Boolean(el?.classList.contains('hv-tile') && !el.hidden);
        }),
      )
      .toBe(true);
  });

  test("Join a pair joins one for you, but then the day isn't perfect", async ({ page }) => {
    await page.goto('/halves/');
    // Five hints, and the last two halves join on their own.
    for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Join a pair' }).click();
    const results = page.getByRole('dialog', { name: 'Well played' });
    await expect(results).toContainText('Hints joined 5 pairs.');
  });

  test('has a How to play page', async ({ page }) => {
    await page.goto('/halves/how-to-play/');
    await expect(page.getByRole('heading', { level: 1, name: 'Halves' })).toBeVisible();
    await expectAccessible(page);
  });
});
