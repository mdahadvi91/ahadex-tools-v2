/**
 * E2E test: mobile responsive. Verifies mobile layout at common
 * breakpoints: iPhone SE, iPhone 12, tablet.
 */

import { test, expect } from '@playwright/test';

const MOBILE_VIEWPORTS = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'iPad Mini', width: 768, height: 1024 },
];

test.describe('Mobile responsive', () => {
  for (const vp of MOBILE_VIEWPORTS) {
    test(`home page renders at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page.locator('header')).toBeVisible();
    });

    test(`tool page renders at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/tools/image-compressor');
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page.getByText(/drop files here/i)).toBeVisible();
    });
  }

  test('desktop nav hidden on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    const primaryNav = page.getByRole('navigation', { name: /primary/i });
    // Primary nav should be hidden (md:flex → hidden below 768px)
    await expect(primaryNav).not.toBeVisible();
  });

  test('menu button visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.getByRole('button', { name: /open menu/i })).toBeVisible();
  });
});
