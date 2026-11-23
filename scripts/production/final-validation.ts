/**
 * Post-build Final Validation Gate Orchestrator (Phase 10).
 *
 * Verifies every emitted artifact inside `dist/` and `public/`:
 *   - Prerendered static HTML files (all routes + 404.html)
 *   - XML Sitemap & robots/llms consistency
 *   - Branded OG PNG & SVG icon integrity
 *   - WCAG/ARIA accessibility & static security boundaries
 *   - Bundle gzip budgets
 *   - Controlled local HTTP crawler simulation (8 crawler profiles)
 *   - Cloudflare Pages _headers / _redirects deployment readiness
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ValidationReport } from '../../src/types/tool';
import { runCrawlerSimulation, type CrawlerSimulationResult } from '../crawlers/simulate-crawlers';
import { runAssetValidation } from '../images/validate-assets';
import { runRobotsAndLlmsValidation } from '../sitemap/validate-robots';
import { runSitemapValidation } from '../sitemap/validate-sitemap';
import { runDeploymentValidation } from '../tasks/deployment';
import { inspectDistPerformanceBudgets } from '../tasks/performance';
import { printValidationReport } from '../utils/validation-utils';
import { runAccessibilityValidation } from '../validation/validate-accessibility';
import { runRouteValidation } from '../validation/validate-routes';
import { runSecurityValidation } from '../validation/validate-security';

export interface FinalValidationResult {
  readonly passed: boolean;
  readonly durationMs: number;
  readonly reports: readonly ValidationReport[];
  readonly crawlerSimulation: CrawlerSimulationResult;
}

export async function runFinalValidation(): Promise<FinalValidationResult> {
  const start = Date.now();

  const reports: ValidationReport[] = [
    await runRouteValidation({ verifyDist: true }),
    await runSitemapValidation({ verifyDist: true }),
    await runRobotsAndLlmsValidation(),
    await runAssetValidation({ verifyDist: true }),
    await runAccessibilityValidation(),
    await runSecurityValidation(),
    inspectDistPerformanceBudgets(),
    await runDeploymentValidation(),
  ];

  const crawlerSimulation = await runCrawlerSimulation();
  reports.push(crawlerSimulation.report);

  for (const report of reports) {
    printValidationReport(report);
  }

  const passed = reports.every((r) => r.status !== 'FAIL');
  return {
    passed,
    durationMs: Date.now() - start,
    reports,
    crawlerSimulation,
  };
}

const isDirectExecution =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  const result = await runFinalValidation();
  if (!result.passed) {
    process.exitCode = 1;
    throw new Error('Post-build validation failed. Inspect critical errors above.');
  }
  console.log(
    `[PASS] validate:post — all ${result.reports.length} post-build gates passed in ${result.durationMs}ms.`,
  );
}
