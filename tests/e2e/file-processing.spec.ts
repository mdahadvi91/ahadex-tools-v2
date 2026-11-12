/**
 * E2E test: file processing. Verifies image compression flow works
 * end-to-end. Uses a small test image.
 */

import { test, expect } from '@playwright/test';

/** Generates a tiny valid PNG in-memory. */
function makeTestImage(): { name: string; mimeType: string; buffer: Buffer } {
  // 1x1 transparent PNG
  const pngBytes = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c63000100000005000101' +
      '0d0a2db40000000049454e44ae426082',
    'hex',
  );
  return { name: 'test.png', mimeType: 'image/png', buffer: pngBytes };
}

test.describe('Image processing flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/image-compressor');
  });

  test('drop zone is visible', async ({ page }) => {
    await expect(page.getByText(/drop files here/i)).toBeVisible();
  });

  test('shows selected file after upload', async ({ page }) => {
    const input = page.locator('input[type="file"]');
    await input.setInputFiles(makeTestImage());
    await expect(page.getByText(/selected files/i)).toBeVisible();
    await expect(page.getByText(/test\.png/)).toBeVisible();
  });

  test('compress button is present after upload', async ({ page }) => {
    const input = page.locator('input[type="file"]');
    await input.setInputFiles(makeTestImage());
    const compressBtn = page.getByRole('button', { name: /compress \d+ file/i });
    await expect(compressBtn).toBeVisible();
  });

  test('shows error for unsupported file', async ({ page }) => {
    const input = page.locator('input[type="file"]');
    await input.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not an image'),
    });
    await expect(page.getByRole('alert')).toBeVisible();
  });
});
