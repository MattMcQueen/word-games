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
    await expect(card).toContainText('Not played yet');
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
    await page
      .getByRole('navigation', { name: 'Sections' })
      .getByRole('link', { name: 'All games' })
      .click();
    const card = page.getByRole('listitem').filter({ hasText: 'Price Tag' });
    await expect(card).toContainText('In progress');
    await expect(card.getByRole('link', { name: 'Continue' })).toBeVisible();
    // Nothing finished yet, so nothing to share.
    await expect(page.getByRole('button', { name: "Share today's scores" })).toHaveCount(0);
  });

  test("shows a game's streak on its card from two days running", async ({ page }) => {
    // A Price Tag streak of 3, last kept up today.
    await page.addInitScript((today) => {
      localStorage.setItem(
        'wg:price-tag:stats',
        JSON.stringify({
          played: 3,
          perfect: 0,
          currentStreak: 3,
          maxStreak: 3,
          lastStreakDate: today,
        }),
      );
    }, DATE);
    await page.goto('/');
    const card = page.getByRole('listitem').filter({ hasText: 'Price Tag' });
    await expect(card).toContainText('🔥 3-day streak');
  });

  test('offers to share the day once a game is finished', async ({ page }) => {
    await page.goto('/price-tag/');
    await page.getByRole('button', { name: 'Finish' }).click();
    await page.getByRole('button', { name: 'Finish and see answers' }).click();
    await page.goto('/');
    await expect(page.getByText("You've done 1 of")).toBeVisible();
    await page.getByRole('button', { name: "Share today's scores" }).click();
    await expect(page.getByText("Today's scores copied to clipboard")).toBeVisible();
  });

  test('every page has a title, a description and a picture for link previews', async ({
    page,
  }) => {
    await page.goto('/halves/');
    await expect(page).toHaveTitle('Halves – Word Games');
    const og = (property: string) =>
      page.locator(`meta[property="og:${property}"]`).getAttribute('content');
    expect(await og('title')).toBe('Halves – Word Games');
    expect(await og('image')).toBe('https://words.matt-rarely-writes.co.uk/og-image.png');
    expect(await og('description')).toMatch(/Halves/);
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      'href',
      '/manifest.webmanifest',
    );
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

  for (const path of ['/cipher/how-to-play/', '/about/']) {
    test(`${path} is in the HTML before any script runs, and nothing moves when it does`, async ({
      page,
    }) => {
      // Hold back the page's scripts until the pre-rendered page has been measured.
      let release = () => {};
      const held = new Promise<void>((resolve) => {
        release = resolve;
      });
      await page.route('**/assets/*.js', async (route) => {
        await held;
        await route.continue();
      });
      const boxes = () =>
        page.evaluate(() =>
          ['h1', '.facts', '.site-footer'].map((selector) => ({
            selector,
            box: document.querySelector(selector)?.getBoundingClientRect().toJSON(),
          })),
        );

      await page.goto(path, { waitUntil: 'commit' });
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('.support-btn')).toHaveCount(0);
      // Load the fonts first, so the only thing that could move the page is the script.
      // (WebKit's document.fonts.ready waits for the held scripts, so load each face.)
      await page.evaluate(() => Promise.all([...document.fonts].map((face) => face.load())));
      const before = await boxes();

      release();
      // The Support me button shows the script has drawn the page.
      await expect(page.locator('.support-btn')).toBeVisible();
      expect(await boxes()).toEqual(before);
    });
  }

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
    // The round button slides away while it would cover a card's buttons; at the foot of the
    // page there's nothing under it, so it comes back.
    const button = page.getByRole('button', { name: 'Support me on Ko-fi' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(button).not.toHaveClass(/is-tucked/);
    const box = await button.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(56); // compact on phones
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: 'Support me on Ko-fi' }).click(),
    ]);
    expect(popup.url()).toContain('ko-fi.com/mattrarelywrites');
  });
});

test.describe('Security headers', () => {
  // Every page, served with the live site's Content-Security-Policy (vite.config.ts), must load
  // without anything being blocked or any script error.
  const pages = [
    '/',
    '/about/',
    ...[
      'price-tag',
      'threader',
      'swap-shop',
      'matryoshka',
      'clean-sweep',
      'hinge',
      'shelf-scramble',
      'halves',
      'retitled',
      'cipher',
      'lockout',
      'lost-for-words',
    ].flatMap((slug) => [`/${slug}/`, `/${slug}/how-to-play/`]),
  ];

  for (const path of pages) {
    test(`${path} loads cleanly under the security policy`, async ({ page }) => {
      const problems: string[] = [];
      page.on('console', (m) => {
        if (m.type() === 'error') problems.push(m.text());
      });
      page.on('pageerror', (e) => problems.push(e.message));
      const res = await page.goto(path);
      expect(res?.headers()['content-security-policy']).toContain("default-src 'self'");
      await expect(page.locator('main')).not.toBeEmpty();
      await page.waitForLoadState('networkidle');
      expect(problems).toEqual([]);
    });
  }
});
