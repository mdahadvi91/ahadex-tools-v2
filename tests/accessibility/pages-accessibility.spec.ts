/**
 * Accessibility test: pages. Verifies semantic HTML and ARIA on key
 * pages using Playwright with basic a11y assertions.
 *
 * Full axe-core audit runs in CI (tests/accessibility/axe-audit).
 */

import { test, expect } from '@playwright/test';

test.describe('Accessibility: pages', () => {
  test('home page has single h1', async ({ page }) => {
    await page.goto('/');
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
  });

  test('home page has main landmark', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();
  });

  test('home page has header landmark', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
  });

  test('home page has footer landmark', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer')).toBeVisible();
  });

  test('home page has navigation landmark', async ({ page }) => {
    await page.goto('/');
    const navCount = await page.locator('nav').count();
    expect(navCount).toBeGreaterThan(0);
  });

  test('tool page has single h1', async ({ page }) => {
    await page.goto('/tools/image-compressor');
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
  });

  test('all images have alt attribute', async ({ page }) => {
    await page.goto('/');
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBeNull();
    }
  });

  test('html has lang attribute', async ({ page }) => {
    await page.goto('/');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
    expect(lang?.length).toBeGreaterThanOrEqual(2);
  });
});
