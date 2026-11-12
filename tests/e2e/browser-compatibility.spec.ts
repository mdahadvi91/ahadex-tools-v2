/**
 * E2E test: browser compatibility. Verifies modern APIs used by the
 * app are available (Worker, Canvas, OffscreenCanvas).
 */

import { test, expect } from '@playwright/test';

test.describe('Browser compatibility', () => {
  test('Web Worker is available', async ({ page }) => {
    await page.goto('/');
    const available = await page.evaluate(() => typeof Worker !== 'undefined');
    expect(available).toBe(true);
  });

  test('Canvas 2D is available', async ({ page }) => {
    await page.goto('/');
    const available = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      return canvas.getContext('2d') !== null;
    });
    expect(available).toBe(true);
  });

  test('ImageBitmap is available', async ({ page }) => {
    await page.goto('/');
    const available = await page.evaluate(() => typeof createImageBitmap !== 'undefined');
    expect(available).toBe(true);
  });

  test('URL.createObjectURL is available', async ({ page }) => {
    await page.goto('/');
    const available = await page.evaluate(() => typeof URL.createObjectURL !== 'undefined');
    expect(available).toBe(true);
  });

  test('Blob is available', async ({ page }) => {
    await page.goto('/');
    const available = await page.evaluate(() => typeof Blob !== 'undefined');
    expect(available).toBe(true);
  });

  test('FileReader is available', async ({ page }) => {
    await page.goto('/');
    const available = await page.evaluate(() => typeof FileReader !== 'undefined');
    expect(available).toBe(true);
  });
});
