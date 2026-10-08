import { expect, test } from '@playwright/test';
import type { MatryoshkaPuzzle, MatryoshkaSolution } from '../../src/games/matryoshka/spec.ts';
import {
  enterWord,
  expectAccessible,
  expectNoHorizontalScroll,
  puzzleFor,
  setUp,
} from './helpers.ts';

const DATE = '2026-10-08';
const { puzzle, solution } = puzzleFor<MatryoshkaPuzzle, MatryoshkaSolution>('matryoshka', DATE);
const chain = solution.chains[0] as string[];

test.beforeEach(async ({ page }) => {
  await page.route(/ko-fi\.com/, (route) => route.abort());
  await setUp(page, DATE, { seenHelp: 'matryoshka' });
});

test.describe('Matryoshka', () => {
  test('starts from the seed', async ({ page }) => {
    await page.goto('/matryoshka/');
    const stack = page.getByRole('list', { name: 'Your chain' });
    await expect(stack.getByRole('listitem')).toHaveCount(1);
    await expect(stack).toContainText(puzzle.seed.toUpperCase());
    await expect(page.locator('.live-line')).toHaveText(
      `Add one letter anywhere in ${puzzle.seed.toUpperCase()}`,
    );
    await expectAccessible(page);
    await expectNoHorizontalScroll(page);
  });

  test('only accepts the current word with one letter added', async ({ page }) => {
    await page.goto('/matryoshka/');
    await enterWord(page, chain[0] as string);
    await expect(page.locator('.feedback')).toContainText('chain of 1');
    // Two steps at once is too many letters: the box stops at one more than the current word.
    await page.keyboard.type(chain[2] as string);
    await expect(page.getByRole('textbox', { name: 'Your word' })).toHaveValue(
      (chain[2] as string).slice(0, (chain[0] as string).length + 1),
    );
  });

  test('undo steps back but keeps the longest chain', async ({ page }) => {
    await page.goto('/matryoshka/');
    await enterWord(page, chain[0] as string);
    await enterWord(page, chain[1] as string);
    await expect(page.locator('.found-heading')).toHaveText('Your longest chain: 2');
    await page.getByRole('button', { name: 'Undo last word' }).click();
    await expect(page.getByRole('list', { name: 'Your chain' }).getByRole('listitem')).toHaveCount(
      2,
    );
    await expect(page.locator('.found-heading')).toHaveText('Your longest chain: 2');
  });

  test('a longest chain is perfect', async ({ page }) => {
    await page.goto('/matryoshka/');
    for (const word of chain) await enterWord(page, word);
    const results = page.getByRole('dialog', { name: 'Perfect!' });
    await expect(results).toContainText('You built the longest chain');
    await expect(page.getByRole('button', { name: 'Undo last word' })).toBeHidden();
    await expectAccessible(page);
  });

  test('finishing early shows example longest chains', async ({ page }) => {
    await page.goto('/matryoshka/');
    await enterWord(page, chain[0] as string);
    await page.getByRole('button', { name: 'Finish' }).click();
    await page.getByRole('button', { name: 'Finish and see answers' }).click();
    const results = page.getByRole('dialog', { name: 'Nice try' });
    await expect(results).toContainText(`the longest has ${solution.best}.`);
    await expect(results.locator('.best-answers li').first()).toContainText(
      [puzzle.seed, ...chain].join(' → ').toUpperCase(),
    );
  });

  test('has a How to play page', async ({ page }) => {
    await page.goto('/matryoshka/how-to-play/');
    await expect(page.getByRole('heading', { level: 1, name: 'Matryoshka' })).toBeVisible();
    await expectAccessible(page);
  });
});
