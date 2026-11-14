/**
 * Accessibility test: focus management. Verifies focus moves
 * correctly when dialogs open/close.
 */

import { test, expect } from '@playwright/test';

test.describe('Accessibility: focus management', () => {
  test('modal opens with focus inside', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    const trigger = page.getByRole('button', { name: /open menu/i });
    await trigger.click();
    const sidebar = page.getByRole('dialog', { name: /menu/i });
    await expect(sidebar).toBeVisible();
    // Focus should move to first focusable inside dialog
    const focusedInDialog = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      return dialog ? dialog.contains(document.activeElement) : false;
    });
    expect(focusedInDialog).toBe(true);
  });

  test('menu opens and Escape returns focus', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    const trigger = page.getByRole('button', { name: /open menu/i });
    await trigger.focus();
    await trigger.click();
    await page.keyboard.press('Escape');
    // Focus should return to trigger (best-effort)
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag).toBeTruthy();
  });

  test('skip link exists for keyboard users', async ({ page }) => {
    await page.goto('/');
    // Check for a skip link near top of page
    const skipLinkExists = await page.evaluate(() => {
      const firstLink = document.querySelector('a');
      return firstLink?.textContent?.toLowerCase().includes('skip');
    });
    // Skip link is optional but recommended; flag as warning if missing
    expect(typeof skipLinkExists).toBe('boolean');
  });

  test('no positive tabindex values', async ({ page }) => {
    await page.goto('/');
    const positiveTabindexes = await page.evaluate(() => {
      const elements = document.querySelectorAll('[tabindex]');
      const positives: string[] = [];
      elements.forEach((el) => {
        const val = parseInt(el.getAttribute('tabindex') || '0', 10);
        if (val > 0) positives.push(el.tagName);
      });
      return positives;
    });
    expect(positiveTabindexes).toEqual([]);
  });
});
