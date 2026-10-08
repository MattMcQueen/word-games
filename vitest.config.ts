import { defineConfig } from 'vitest/config';

// Unit tests sit next to the code they test (*.test.ts). Playwright specs in
// tests/e2e are run separately by `npm run test:e2e`.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'node',
  },
});
