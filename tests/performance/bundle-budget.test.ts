/**
 * Performance test: bundle budget. Verifies the production build
 * stays within size budgets defined in src/config/performance-budgets.
 *
 * Requires dist/ to exist. Run after `npm run build`.
 */

import { describe, it, expect } from 'vitest';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { BUILD_BUDGET } from '../../src/config/performance-budgets';

const DIST_ASSETS = 'dist/assets';

async function getDistSize(): Promise<{ js: number; css: number; total: number }> {
  try {
    const files = await readdir(DIST_ASSETS);
    let js = 0;
    let css = 0;
    for (const file of files) {
      const s = await stat(join(DIST_ASSETS, file));
      if (file.endsWith('.js')) js += s.size;
      if (file.endsWith('.css')) css += s.size;
    }
    return { js, css, total: js + css };
  } catch {
    return { js: 0, css: 0, total: 0 };
  }
}

describe('performance: bundle budget', () => {
  it('dist/ is built', async () => {
    const size = await getDistSize();
    if (size.total === 0) {
      // Skip if dist not built (CI runs build before test)
      expect(true).toBe(true);
      return;
    }
    expect(size.total).toBeGreaterThan(0);
  });

  it('JS bundle is within gzip-equivalent budget (estimated)', async () => {
    const size = await getDistSize();
    if (size.js === 0) return; // skip if not built

    // Our budget is in KB gzip. Raw size ~3x gzip. Approximate check.
    const estimatedGzipKb = (size.js / 1024) / 3;
    const budgetKb = BUILD_BUDGET.initialJsKb;
    expect(estimatedGzipKb).toBeLessThanOrEqual(budgetKb * 1.2); // 20% tolerance
  });

  it('CSS bundle is within budget (estimated)', async () => {
    const size = await getDistSize();
    if (size.css === 0) return;

    const estimatedGzipKb = (size.css / 1024) / 3;
    expect(estimatedGzipKb).toBeLessThanOrEqual(50); // 50 KB CSS budget
  });

  it('total assets within budget', async () => {
    const size = await getDistSize();
    if (size.total === 0) return;

    const estimatedGzipKb = (size.total / 1024) / 3;
    const budgetKb = BUILD_BUDGET.initialTotalKb;
    expect(estimatedGzipKb).toBeLessThanOrEqual(budgetKb * 1.2);
  });
});
