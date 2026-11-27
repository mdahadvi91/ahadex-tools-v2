/**
 * Playwright config for E2E tests. Two projects:
 *   - e2e-dev: runs against the Vite dev server (port 3000)
 *   - e2e-prod: runs against `vite preview` serving prerendered `dist/` (port 4173)
 */

import fs from 'node:fs';
import { chromium, defineConfig, devices } from '@playwright/test';

const CONTAINER_SHELL_PATH = '/ms-playwright/chrome-headless-shell-linux64/chrome-headless-shell';

function resolveChromiumExecutable(): string | undefined {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  }
  try {
    const defaultPath = chromium.executablePath();
    if (fs.existsSync(defaultPath)) {
      return undefined;
    }
  } catch {
    // Playwright throws on unsupported platforms like Termux/Android.
  }
  if (fs.existsSync(CONTAINER_SHELL_PATH)) {
    return CONTAINER_SHELL_PATH;
  }
  return undefined;
}

const executablePath = resolveChromiumExecutable();

const requestedProjects = process.argv.join(' ');
const onlyProdProject =
  requestedProjects.includes('e2e-prod') && !requestedProjects.includes('e2e-dev');
const onlyDevProject =
  requestedProjects.includes('e2e-dev') && !requestedProjects.includes('e2e-prod');

const devServer = {
  command: 'npm run dev -- --host 127.0.0.1 --port 3000',
  url: 'http://127.0.0.1:3000',
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,
};

const previewServer = {
  command: 'npm run preview -- --host 127.0.0.1 --port 4173',
  url: 'http://127.0.0.1:4173',
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,
};

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 2,
  reporter: process.env.CI ? [['github'], ['html']] : 'list',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    launchOptions: executablePath ? { executablePath } : undefined,
  },
  projects: [
    {
      name: 'e2e-dev',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:3000' },
    },
    {
      name: 'e2e-prod',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:4173' },
    },
  ],
  webServer: onlyProdProject
    ? [previewServer]
    : onlyDevProject
      ? [devServer]
      : [devServer, previewServer],
});
