/**
 * Web Vitals config validator. Ensures the runtime thresholds in
 * src/platform/performance/web-vitals.ts match the documented
 * budgets in RUNTIME_BUDGET:
 *   - LCP, CLS, INP, TTFB thresholds present
 *   - THRESHOLDS values match config values
 *   - measureWebVitals observer is wired (function exists)
 */

import { join } from 'node:path';
import { readText, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

const WEB_VITALS = join(PATHS.srcPlatform, 'performance/web-vitals.ts');
const BUDGETS = join(PATHS.srcConfig, 'performance-budgets.ts');

interface RuntimeBudget {
  lcpMs: number;
  cls: number;
  inpMs: number;
  ttfbMs: number;
}

async function loadBudgets(): Promise<RuntimeBudget | null> {
  if (!(await pathExists(BUDGETS))) return null;
  const src = await readText(BUDGETS);
  const num = (re: RegExp): number | null => {
    const m = src.match(re);
    return m ? parseFloat(m[1]) : null;
  };
  const lcp = num(/lcpMs:\s*(\d+(?:\.\d+)?)/);
  const cls = num(/cls:\s*(\d+(?:\.\d+)?)/);
  const inp = num(/inpMs:\s*(\d+(?:\.\d+)?)/);
  const ttfb = num(/ttfbMs:\s*(\d+(?:\.\d+)?)/);
  if (lcp === null || cls === null || inp === null || ttfb === null) return null;
  return { lcpMs: lcp, cls, inpMs: inp, ttfbMs: ttfb };
}

function extractThreshold(src: string, key: 'LCP' | 'CLS' | 'FID' | 'INP' | 'TTFB', field: 'good' | 'poor'): number | null {
  // Match: LCP: { good: 2500, poor: 4000 }
  const re = new RegExp(`${key}\\s*:\\s*\\{[^}]*${field}\\s*:\\s*([0-9.]+)`, 'i');
  const m = src.match(re);
  return m ? parseFloat(m[1]) : null;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  if (!(await pathExists(WEB_VITALS))) {
    return [
      error('web-vitals-missing', 'src/platform/performance/web-vitals.ts is missing.', {
        file: 'src/platform/performance/web-vitals.ts',
      }),
    ];
  }

  const src = await readText(WEB_VITALS);

  // Rule 1: THRESHOLDS block exists.
  if (!/THRESHOLDS\s*:\s*Record/.test(src)) {
    violations.push(
      error(
        'thresholds-missing',
        'web-vitals.ts does not declare THRESHOLDS.',
        { file: 'src/platform/performance/web-vitals.ts' },
      ),
    );
  }

  // Rule 2: LCP, CLS, INP, TTFB, FID keys present.
  const requiredKeys: Array<'LCP' | 'CLS' | 'FID' | 'INP' | 'TTFB'> = ['LCP', 'CLS', 'FID', 'INP', 'TTFB'];
  for (const key of requiredKeys) {
    if (!new RegExp(`\\b${key}\\b`).test(src)) {
      violations.push(
        error(
          'threshold-missing',
          `Threshold for "${key}" is missing.`,
          { file: 'src/platform/performance/web-vitals.ts' },
        ),
      );
    }
  }

  // Rule 3: observer function is exported.
  if (!/export\s+function\s+observe(?:Web)?Vitals/.test(src)) {
    violations.push(
      warning(
        'no-observer',
        'web-vitals.ts does not export an observe/observeWebVitals function.',
        { file: 'src/platform/performance/web-vitals.ts' },
      ),
    );
  }

  // Rule 4: threshold good values match RUNTIME_BUDGET.
  const budgets = await loadBudgets();
  if (budgets === null) {
    violations.push(
      warning(
        'budgets-unreadable',
        'Could not read RUNTIME_BUDGET from performance-budgets.ts.',
        { file: 'src/config/performance-budgets.ts' },
      ),
    );
  } else {
    const lcpGood = extractThreshold(src, 'LCP', 'good');
    const clsGood = extractThreshold(src, 'CLS', 'good');
    const inpGood = extractThreshold(src, 'INP', 'good');
    const ttfbGood = extractThreshold(src, 'TTFB', 'good');

    const checks: Array<[string, number | null, number]> = [
      ['LCP', lcpGood, budgets.lcpMs],
      ['CLS', clsGood, budgets.cls],
      ['INP', inpGood, budgets.inpMs],
      ['TTFB', ttfbGood, budgets.ttfbMs],
    ];

    for (const [name, actual, expected] of checks) {
      if (actual === null) {
        violations.push(
          warning(
            'threshold-unreadable',
            `Cannot parse ${name} "good" threshold.`,
            { file: 'src/platform/performance/web-vitals.ts' },
          ),
        );
      } else if (Math.abs(actual - expected) > 0.001) {
        violations.push(
          error(
            'threshold-mismatch',
            `${name} "good" threshold is ${actual}, but RUNTIME_BUDGET says ${expected}.`,
            {
              file: 'src/platform/performance/web-vitals.ts',
              hint: `Update THRESHOLDS.${name}.good or RUNTIME_BUDGET.${name.toLowerCase()}.`,
            },
          ),
        );
      }
    }
  }

  // Rule 5: rating function present.
  if (!/function\s+rate\b/.test(src)) {
    violations.push(
      warning(
        'no-rate-function',
        'web-vitals.ts does not declare a rate() helper.',
        { file: 'src/platform/performance/web-vitals.ts' },
      ),
    );
  }

  return violations;
}
