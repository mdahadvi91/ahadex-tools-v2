/**
 * Bundle size validator. Reads dist/ after a build and compares
 * gzip sizes against BUILD_BUDGET. Fails if any budget is exceeded.
 *
 * Reads budgets from src/config/performance-budgets.ts as text to
 * avoid a cross-project import (scripts use a separate tsconfig).
 */

import { join } from 'node:path';
import { readdir, stat } from 'node:fs/promises';
import { readText, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, info, warning, type Violation } from '../../utils/validation-result';
import { gzipSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';

interface BuildBudget {
  initialJsKb: number;
  initialTotalKb: number;
  maxAssetKb: number;
  maxInitialChunks: number;
}

async function loadBudgets(): Promise<BuildBudget | null> {
  const path = join(PATHS.srcConfig, 'performance-budgets.ts');
  if (!(await pathExists(path))) return null;
  const src = await readText(path);

  function num(pattern: RegExp): number | null {
    const m = src.match(pattern);
    return m ? parseInt(m[1], 10) : null;
  }

  const jsKb = num(/initialJsKb:\s*(\d+)/);
  const totalKb = num(/initialTotalKb:\s*(\d+)/);
  const assetKb = num(/maxAssetKb:\s*(\d+)/);
  const chunks = num(/maxInitialChunks:\s*(\d+)/);

  if (jsKb === null || totalKb === null || assetKb === null || chunks === null) {
    return null;
  }
  return {
    initialJsKb: jsKb,
    initialTotalKb: totalKb,
    maxAssetKb: assetKb,
    maxInitialChunks: chunks,
  };
}

interface AssetSize {
  name: string;
  bytes: number;
  gzipBytes: number;
  type: 'js' | 'css' | 'other';
}

async function measureDist(distDir: string): Promise<AssetSize[]> {
  const results: AssetSize[] = [];
  const assetsDir = join(distDir, 'assets');
  if (!(await pathExists(assetsDir))) return results;

  const entries = await readdir(assetsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const fullPath = join(assetsDir, entry.name);
    const info2 = await stat(fullPath);
    const content = await readFile(fullPath);
    const gzipBytes = gzipSync(content).length;
    const ext = entry.name.split('.').pop() ?? '';
    const type = ext === 'js' ? 'js' : ext === 'css' ? 'css' : 'other';
    results.push({ name: entry.name, bytes: info2.size, gzipBytes, type });
  }
  return results;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  if (!(await pathExists(PATHS.dist))) {
    return [
      warning(
        'dist-missing',
        'dist/ directory does not exist. Run `npm run build` first.',
        { hint: 'Bundle size cannot be validated without a production build.' },
      ),
    ];
  }

  const budgets = await loadBudgets();
  if (!budgets) {
    return [
      error(
        'budgets-unreadable',
        'Could not read BUILD_BUDGET from src/config/performance-budgets.ts.',
        { file: 'src/config/performance-budgets.ts' },
      ),
    ];
  }

  const assets = await measureDist(PATHS.dist);
  if (assets.length === 0) {
    return [
      warning('no-assets', 'dist/assets/ contains no files to measure.', {
        file: 'dist/assets/',
      }),
    ];
  }

  const jsAssets = assets.filter((a) => a.type === 'js');
  const cssAssets = assets.filter((a) => a.type === 'css');

  const initialJsBytes = jsAssets.reduce((sum, a) => sum + a.gzipBytes, 0);
  const initialCssBytes = cssAssets.reduce((sum, a) => sum + a.gzipBytes, 0);
  const initialTotalBytes = assets.reduce((sum, a) => sum + a.gzipBytes, 0);

  const initialJsKb = initialJsBytes / 1024;
  const initialTotalKb = initialTotalBytes / 1024;

  if (initialJsKb > budgets.initialJsKb) {
    violations.push(
      error(
        'bundle-js-too-large',
        `Initial JS is ${initialJsKb.toFixed(1)} KB gzip, budget ${budgets.initialJsKb} KB.`,
        {
          hint: 'Reduce bundle size via code splitting or dependency removal.',
        },
      ),
    );
  } else {
    violations.push(
      info(
        'bundle-js-ok',
        `Initial JS: ${initialJsKb.toFixed(1)} KB / ${budgets.initialJsKb} KB (${(initialJsKb / budgets.initialJsKb * 100).toFixed(0)}%).`,
      ),
    );
  }

  if (initialTotalKb > budgets.initialTotalKb) {
    violations.push(
      error(
        'bundle-total-too-large',
        `Initial total is ${initialTotalKb.toFixed(1)} KB gzip, budget ${budgets.initialTotalKb} KB.`,
        { hint: 'Includes JS + CSS + other assets.' },
      ),
    );
  } else {
    violations.push(
      info(
        'bundle-total-ok',
        `Initial total: ${initialTotalKb.toFixed(1)} KB / ${budgets.initialTotalKb} KB (${(initialTotalKb / budgets.initialTotalKb * 100).toFixed(0)}%).`,
      ),
    );
  }

  // Check individual assets.
  for (const asset of assets) {
    const assetKb = asset.gzipBytes / 1024;
    if (assetKb > budgets.maxAssetKb) {
      violations.push(
        error(
          'asset-too-large',
          `Asset "${asset.name}" is ${assetKb.toFixed(1)} KB gzip, budget ${budgets.maxAssetKb} KB.`,
          { hint: 'Split this asset or remove unused code.' },
        ),
      );
    }
  }

  // Check chunk count.
  if (jsAssets.length > budgets.maxInitialChunks) {
    violations.push(
      warning(
        'too-many-chunks',
        `${jsAssets.length} JS chunks, budget ${budgets.maxInitialChunks}.`,
        { hint: 'More chunks means more HTTP requests.' },
      ),
    );
  }

  violations.push(
    info(
      'bundle-summary',
      `JS: ${jsAssets.length} files, ${initialJsKb.toFixed(1)} KB | CSS: ${cssAssets.length} files, ${(initialCssBytes / 1024).toFixed(1)} KB`,
    ),
  );

  return violations;
}
