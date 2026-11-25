import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const ROUTES = [
  '/',
  '/about/',
  '/contact/',
  '/privacy-policy/',
  '/terms/',
  '/disclaimer/',
  '/cookie-policy/',
  '/image-compressor/',
  '/image-resizer/',
  '/pdf-compressor/',
  '/merge-pdf/',
  '/split-pdf/',
] as const;

test.describe('WCAG 2.2 A/AA accessibility', () => {
  for (const route of ROUTES) {
    test(`should have no detectable accessibility violations: ${route}`, async ({ page }) => {
      const response = await page.goto(route, {
        waitUntil: 'load',
      });

      expect(response, `No response received for ${route}`).not.toBeNull();
      expect(response?.ok(), `Failed to load ${route}`).toBe(true);

      await expect(page.locator('main')).toHaveCount(1);
      await expect(page.locator('h1')).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'])
        .analyze();

      const violations = results.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        description: violation.description,
        help: violation.help,
        nodes: violation.nodes.map((node) => ({
          target: node.target,
          failureSummary: node.failureSummary,
        })),
      }));

      expect(
        violations,
        `Accessibility violations on ${route}:\n${JSON.stringify(violations, null, 2)}`,
      ).toEqual([]);
    });
  }
});
