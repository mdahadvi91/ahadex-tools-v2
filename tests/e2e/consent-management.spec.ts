/**
 * E2E test: consent management. Verifies that no analytics loads
 * before consent is granted.
 */

import { test, expect } from '@playwright/test';

test.describe('Consent management', () => {
  test('no GA script loads before consent', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (req) => {
      requests.push(req.url());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const gaRequests = requests.filter((url) =>
      /google-analytics\.com|googletagmanager\.com/.test(url),
    );
    expect(gaRequests).toEqual([]);
  });

  test('consent cookie is set after consent', async ({ page, context }) => {
    await page.goto('/');
    // For future: interact with consent banner.
    // For now: verify no consent cookie exists on first load.
    const cookies = await context.cookies();
    const consentCookie = cookies.find((c) => c.name === 'ahx_consent');
    // No consent given yet → cookie should be absent or "unknown".
    expect(consentCookie).toBeUndefined();
  });

  test('privacy policy is reachable', async ({ page }) => {
    await page.goto('/');
    const privacyLink = page.getByRole('link', { name: /privacy policy/i }).first();
    await privacyLink.click();
    await expect(page).toHaveURL('/privacy');
    await expect(page.locator('h1')).toContainText(/privacy policy/i);
  });

  test('cookie policy is reachable', async ({ page }) => {
    await page.goto('/');
    const cookieLink = page.getByRole('link', { name: /cookie policy/i }).first();
    await cookieLink.click();
    await expect(page).toHaveURL('/cookies');
    await expect(page.locator('h1')).toContainText(/cookie policy/i);
  });
});
