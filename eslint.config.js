import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    'node_modules/**',
    '.build/**',
    'dist/**',
    'dist-ssr/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    '.wrangler/**',
  ]),

  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [js.configs.recommended, prettier],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      prettier,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.worker,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  {
    files: [
      'vite.config.ts',
      'vitest.config.ts',
      'playwright.config.ts',
      'scripts/**/*.ts',
      'tests/**/*.{ts,tsx}',
    ],
    extends: [js.configs.recommended, tseslint.configs.recommended, prettier],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
]);
