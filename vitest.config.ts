/**
 * Vitest configuration. Runs unit & security tests in src/ and scripts/.
 * Excludes Playwright specs (tests/e2e), .build, and dist.
 */

import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: false,
    environment: 'jsdom',
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'src/**/__tests__/**/*.test.ts',
      'src/**/__tests__/**/*.test.tsx',
      'scripts/**/*.test.ts',
      'tests/security/**/*.test.ts',
    ],
    exclude: ['node_modules', '.build', 'dist', 'tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**', '**/tests/**'],
    },
  },
});
