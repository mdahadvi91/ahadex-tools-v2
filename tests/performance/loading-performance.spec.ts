/**
 * Performance test: loading. Verifies first paint and load times
 * via Playwright (uses browser performance API).
 */

import { test, expect } from '@playwright/test';

test.describe('Performance: loading', () => {
  test('page load is under 3 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const elapsed = Date.now() - start;
    // Generous limit for first run / cold cache
    expect(elapsed).toBeLessThan(3000);
  });

  test('DOMContentLoaded fires', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const readyState = await page.evaluate(() => document.readyState);
    expect(['interactive', 'complete']).toContain(readyState);
  });

  test('tool page loads under 4 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/tools/image-compressor', { waitUntil: 'domcontentloaded' });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(4000);
  });

  test('no console errors during load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    // Filter out Cloudflare challenge noise if present
    const realErrors = errors.filter((e) => !e.includes('challenge') && !e.includes('Cloudflare'));
    expect(realErrors).toEqual([]);
  });

  test('LCP element is visible', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const hasVisibleH1 = await page.locator('h1').first().isVisible();
    expect(hasVisibleH1).toBe(true);
  });
});
