/**
 * E2E test: tool pages. Verifies each tool page loads with hero,
 * dropzone, content sections, and FAQ.
 */

import { test, expect } from '@playwright/test';

test.describe('Image Compressor page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/image-compressor');
  });

  test('loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Image Compressor/i);
  });

  test('renders hero h1', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Image Compressor');
  });

  test('renders dropzone', async ({ page }) => {
    await expect(page.getByText(/drop files here/i)).toBeVisible();
  });

  test('renders content sections', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /what this tool does/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /how compression works/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /privacy and data handling/i })).toBeVisible();
  });

  test('renders FAQ questions', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /frequently asked/i })).toBeVisible();
    const faqItems = page.locator('details');
    await expect(faqItems.first()).toBeVisible();
  });

  test('no misleading "0 KB sent" claim', async ({ page }) => {
    const body = await page.locator('body').textContent();
    expect(body).not.toMatch(/0\s*KB\s*sent/i);
  });

  test('has references section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /references/i })).toBeVisible();
    const mdnLink = page.getByRole('link', { name: /MDN/i });
    await expect(mdnLink.first()).toBeVisible();
  });
});
