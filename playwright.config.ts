import { defineConfig, devices } from '@playwright/test';

// End-to-end tests run against the production build (vite build + preview),
// so they exercise exactly what gets deployed.
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  // Three browsers in parallel can starve WebKit of CPU while a page parses the
  // word list, so allow more time than Playwright's defaults.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    locale: 'en-GB',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    // WebKit is the engine behind Safari and every browser on iPhone.
    { name: 'iphone', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: 'npx vite build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
