import { defineConfig } from 'vitest/config';

// Unit tests sit next to the code they test (*.test.ts). Playwright specs in
// tests/e2e are run separately by `npm run test:e2e`.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'node',
    // Some tests generate real puzzles from the full word list, which takes a few
    // seconds with coverage switched on.
    testTimeout: 30_000,
    // Coverage feeds fallow's CRAP scores (npm run fallow). Browser UI code is
    // covered by the Playwright tests instead, which this doesn't measure.
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'scripts/**/*.ts'],
      exclude: ['**/*.test.ts'],
      reporter: ['json', 'text-summary'],
    },
  },
});
