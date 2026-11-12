/**
 * E2E test: navigation. Verifies header links work and mobile menu
 * opens.
 */

import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('header logo links to home', async ({ page }) => {
    await page.goto('/about');
    await page.getByRole('link', { name: /AHADEX Tools.*home/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('desktop nav shows all links', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: /primary/i });
    await expect(nav.getByRole('link', { name: /^Home$/ })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^Tools$/ })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^About$/ })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^Contact$/ })).toBeVisible();
  });

  test('mobile menu opens via menu button', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.getByRole('button', { name: /open menu/i }).click();
    const sidebar = page.getByRole('dialog', { name: /menu/i });
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /^About$/ })).toBeVisible();
  });

  test('navigation to about page works', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /^About$/ }).first().click();
    await expect(page).toHaveURL('/about');
    await expect(page.locator('h1')).toContainText(/About/i);
  });

  test('404 page shows for unknown route', async ({ page }) => {
    await page.goto('/this-does-not-exist');
    await expect(page.locator('h1')).toContainText(/404|not found/i);
  });
});
