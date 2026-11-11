/**
 * Vitest configuration. Runs unit tests in src/ and scripts/.
 * Excludes Playwright specs (tests/e2e) and dist.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'scripts/**/*.test.ts',
      'tests/integration/**/*.test.ts',
      'tests/security/**/*.test.ts',
      'tests/performance/**/*.test.ts',
    ],
    exclude: [
      'node_modules',
      'dist',
      'tests/e2e/**',
      'tests/accessibility/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['**/*.test.ts', '**/*.test.tsx', '**/tests/**'],
    },
  },
});
