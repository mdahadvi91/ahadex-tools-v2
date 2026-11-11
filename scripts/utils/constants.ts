/**
 * Canonical constants for all script validators.
 * Every validator uses these instead of hardcoded strings.
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Project root: two levels up from scripts/utils/. */
export const PROJECT_ROOT = resolve(__dirname, '../..');

export const PATHS = {
  root: PROJECT_ROOT,
  src: resolve(PROJECT_ROOT, 'src'),
  srcTools: resolve(PROJECT_ROOT, 'src/tools'),
  srcComponents: resolve(PROJECT_ROOT, 'src/components'),
  srcPages: resolve(PROJECT_ROOT, 'src/pages'),
  srcConfig: resolve(PROJECT_ROOT, 'src/config'),
  srcRouter: resolve(PROJECT_ROOT, 'src/router'),
  srcPlatform: resolve(PROJECT_ROOT, 'src/platform'),
  docs: resolve(PROJECT_ROOT, 'docs'),
  docsAdr: resolve(PROJECT_ROOT, 'docs/adr'),
  public: resolve(PROJECT_ROOT, 'public'),
  tests: resolve(PROJECT_ROOT, 'tests'),
  scripts: resolve(PROJECT_ROOT, 'scripts'),
  dist: resolve(PROJECT_ROOT, 'dist'),
  packageJson: resolve(PROJECT_ROOT, 'package.json'),
  tsconfig: resolve(PROJECT_ROOT, 'tsconfig.json'),
  envExample: resolve(PROJECT_ROOT, '.env.example'),
  viteConfig: resolve(PROJECT_ROOT, 'vite.config.ts'),
  publicRobots: resolve(PROJECT_ROOT, 'public/robots.txt'),
  publicSitemap: resolve(PROJECT_ROOT, 'public/sitemap.xml'),
  publicAdsTxt: resolve(PROJECT_ROOT, 'public/ads.txt'),
  publicHeaders: resolve(PROJECT_ROOT, 'public/_headers'),
  publicRedirects: resolve(PROJECT_ROOT, 'public/_redirects'),
} as const;

export const EXIT_CODES = {
  OK: 0,
  FAILURE: 1,
  CONFIG_ERROR: 2,
  UNEXPECTED: 3,
} as const;

export const TIMEOUTS = {
  FILE_READ_MS: 5000,
  HTTP_REQUEST_MS: 10000,
  FULL_TASK_MS: 120000,
} as const;
