/**
 * E2E test: homepage. Verifies the home page loads with all expected
 * elements: header, hero, tool grid, footer.
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads with title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/AHADEX Tools/i);
  });

  test('renders header with logo and title', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header.locator('img')).toBeVisible();
    await expect(header.getByText('AHADEX Tools')).toBeVisible();
  });

  test('renders hero section', async ({ page }) => {
    await page.goto('/');
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('AHADEX Tools');
  });

  test('renders tool grid with image-compressor card', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Image Compressor/i })).toBeVisible();
  });

  test('renders footer with legal links', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer.getByRole('link', { name: /Privacy Policy/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /Terms/i })).toBeVisible();
  });

  test('has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });
});
