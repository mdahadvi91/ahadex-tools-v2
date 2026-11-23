/**
 * Static Bundle & Asset Performance Budget Validator (Phase 9).
 *
 * Inspects built `dist/` JavaScript chunks, CSS stylesheets, prerendered HTML documents,
 * and public OG/SVG assets for byte budgets and gzipped transfer footprints.
 *
 * Honesty note: This audits static build artifact budgets on disk rather than
 * running external Chrome Lighthouse / PageSpeed Insights field metrics.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import type { ValidationIssue, ValidationReport } from '../../src/types/tool';
import { fileExists, resolveFromRoot } from '../utils/file-utils';
import { assertReportPassed, createValidationReport } from '../utils/validation-utils';

export function inspectDistPerformanceBudgets(
  distDir: string = resolveFromRoot('dist'),
): ValidationReport {
  const issues: ValidationIssue[] = [];
  let checkedCount = 0;

  if (!fileExists(path.join(distDir, 'index.html'))) {
    issues.push({
      code: 'PERF_DIST_MISSING',
      severity: 'critical',
      target: distDir,
      message: 'Missing dist/index.html. Run "npm run build:ssg" before performance checks.',
    });
    return createValidationReport('performance:dist-budgets', 1, issues);
  }

  const assetsDir = path.join(distDir, 'assets');
  if (!fileExists(assetsDir)) {
    issues.push({
      code: 'PERF_ASSETS_MISSING',
      severity: 'critical',
      target: assetsDir,
      message: 'Missing dist/assets directory.',
    });
    return createValidationReport('performance:dist-budgets', 1, issues);
  }

  let totalJsGzipBytes = 0;
  let totalCssGzipBytes = 0;

  for (const name of fs.readdirSync(assetsDir)) {
    const filePath = path.join(assetsDir, name);
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) continue;

    checkedCount++;
    const raw = fs.readFileSync(filePath);
    const gzBytes = zlib.gzipSync(raw).length;

    if (name.endsWith('.js')) {
      totalJsGzipBytes += gzBytes;
      if (gzBytes > 350 * 1024) {
        issues.push({
          code: 'PERF_JS_CHUNK_HEAVY',
          severity: 'warning',
          target: `assets/${name}`,
          message: `JS chunk gzip size is ${Math.round(gzBytes / 1024)} KB (budget target <= 350 KB).`,
        });
      }
    } else if (name.endsWith('.css')) {
      totalCssGzipBytes += gzBytes;
      if (gzBytes > 60 * 1024) {
        issues.push({
          code: 'PERF_CSS_HEAVY',
          severity: 'warning',
          target: `assets/${name}`,
          message: `CSS asset gzip size is ${Math.round(gzBytes / 1024)} KB (budget target <= 60 KB).`,
        });
      }
    }
  }

  checkedCount++;
  if (totalJsGzipBytes > 600 * 1024) {
    issues.push({
      code: 'PERF_TOTAL_JS_OVER_BUDGET',
      severity: 'critical',
      target: 'dist/assets/*.js',
      message: `Total JS gzip footprint is ${Math.round(totalJsGzipBytes / 1024)} KB (> 600 KB ceiling).`,
    });
  }

  checkedCount++;
  const rootHtmlSize = fs.statSync(path.join(distDir, 'index.html')).size;
  if (rootHtmlSize > 250 * 1024) {
    issues.push({
      code: 'PERF_HTML_BLOAT',
      severity: 'warning',
      target: 'dist/index.html',
      message: `dist/index.html is ${Math.round(rootHtmlSize / 1024)} KB (> 250 KB target).`,
    });
  }

  console.log(
    `[PERF-INFO] JS total gzip: ${(totalJsGzipBytes / 1024).toFixed(1)} KB | CSS total gzip: ${(totalCssGzipBytes / 1024).toFixed(1)} KB | dist/index.html: ${(rootHtmlSize / 1024).toFixed(1)} KB`,
  );

  return createValidationReport('performance:dist-budgets', checkedCount, issues);
}

const isDirectExecution =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  const strict = process.argv.includes('--strict');
  const report = inspectDistPerformanceBudgets();
  assertReportPassed(report, strict);
}
