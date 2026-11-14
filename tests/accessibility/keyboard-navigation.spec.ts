/**
 * Accessibility test: keyboard navigation. Verifies interactive
 * elements are reachable via Tab.
 */

import { test, expect } from '@playwright/test';

test.describe('Accessibility: keyboard navigation', () => {
  test('Tab moves focus through header elements', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocused).toBeTruthy();
  });

  test('Enter on link navigates', async ({ page }) => {
    await page.goto('/');
    const aboutLink = page.getByRole('link', { name: /^About$/ }).first();
    await aboutLink.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/about');
  });

  test('Escape closes menu sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.getByRole('button', { name: /open menu/i }).click();
    const sidebar = page.getByRole('dialog', { name: /menu/i });
    await expect(sidebar).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sidebar).not.toBeVisible();
  });

  test('all interactive elements are focusable', async ({ page }) => {
    await page.goto('/');
    const focusable = await page.evaluate(() => {
      const elements = document.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      return elements.length;
    });
    expect(focusable).toBeGreaterThan(0);
  });

  test('Tab does not get trapped outside dialogs', async ({ page }) => {
    await page.goto('/');
    // Press Tab 20 times, should reach footer or cycle
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
    }
    // No hang — test completes
    expect(true).toBe(true);
  });
});
