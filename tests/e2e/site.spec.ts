import { expect, test } from '@playwright/test';
import { enterWord, expectAccessible, expectNoHorizontalScroll, setUp } from './helpers.ts';

const DATE = '2026-10-08';

test.beforeEach(async ({ page }) => {
  // Never contact Ko-fi from the tests.
  await page.route(/ko-fi\.com/, (route) => route.abort());
  await setUp(page, DATE, { seenHelp: 'price-tag' });
});

test.describe('Home page', () => {
  test('lists the games with links to play and to the rules', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Daily word games' })).toBeVisible();
    const card = page.getByRole('listitem').filter({ hasText: 'Price Tag' });
    await expect(card).toContainText('Not played today');
    await expect(card.getByRole('link', { name: 'How to play' })).toHaveAttribute(
      'href',
      '/price-tag/how-to-play/',
    );
    await card.getByRole('link', { name: 'Play', exact: true }).click();
    await expect(page).toHaveURL(/\/price-tag\/$/);
    await expectNoHorizontalScroll(page);
  });

  test("shows today's progress", async ({ page }) => {
    await page.goto('/price-tag/');
    await enterWord(page, 'bags');
    await expect(page.getByText('Words found: 1')).toBeVisible();
    await page.getByRole('link', { name: 'All games' }).click();
    const card = page.getByRole('listitem').filter({ hasText: 'Price Tag' });
    await expect(card).toContainText('In progress');
    await expect(card.getByRole('link', { name: 'Continue' })).toBeVisible();
  });

  test('is accessible in light and dark mode', async ({ page }) => {
    await page.goto('/');
    await expectAccessible(page);
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload(); // so colours aren't measured mid-transition
    await expectAccessible(page);
  });
});

test.describe('How to play and About', () => {
  test('How to play has the rules and a way back to the game', async ({ page }) => {
    await page.goto('/price-tag/how-to-play/');
    await expect(page).toHaveTitle('How to play Price Tag – Word Games');
    await expect(page.getByRole('heading', { level: 1, name: 'Price Tag' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The goal' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'How to play' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expectAccessible(page);
    await expectNoHorizontalScroll(page);
  });

  test('About credits the word list and explains privacy', async ({ page }) => {
    await page.goto('/about/');
    await expect(page.getByRole('heading', { name: 'Privacy' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'SCOWL' })).toBeVisible();
    await expectAccessible(page);
  });
});

test.describe('Theme', () => {
  test('switches between light and dark and remembers the choice', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    const html = page.locator('html');
    await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe('rgb(19, 23, 29)');

    // Remembered on another page, before any of our module code runs.
    await page.goto('/price-tag/');
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await page.getByRole('button', { name: 'Switch to light mode' }).click();
    await expect(html).toHaveAttribute('data-theme', 'light');
  });
});

test.describe('Support me', () => {
  test('loads nothing from Ko-fi until the panel is opened', async ({ page, isMobile }) => {
    test.skip(isMobile, 'On phones the button opens Ko-fi in a new tab instead.');
    const kofiRequests: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('ko-fi.com')) kofiRequests.push(r.url());
    });
    await page.goto('/');
    await expect(page.locator('iframe')).toHaveCount(0);
    expect(kofiRequests).toEqual([]);

    await page.getByRole('button', { name: 'Support me on Ko-fi' }).click();
    const panel = page.locator('#kofi-panel');
    await expect(panel).toBeVisible();
    await expect(panel.locator('iframe')).toHaveAttribute('src', /ko-fi\.com\/mattrarelywrites/);
    await panel.getByRole('button', { name: 'Close' }).click();
    await expect(panel).toBeHidden();
  });

  test('opens Ko-fi in a new tab on phones', async ({ page, isMobile, context }) => {
    test.skip(!isMobile, 'Phones only.');
    await page.goto('/');
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: 'Support me on Ko-fi' }).click(),
    ]);
    expect(popup.url()).toContain('ko-fi.com/mattrarelywrites');
  });
});
