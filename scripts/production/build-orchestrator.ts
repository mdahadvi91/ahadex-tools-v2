/**
 * Unified Production Build Orchestrator for AHADEX Tools (P1 / Phase 10).
 *
 * Executes the complete deterministic static site build and quality gate:
 *   1. Generate/sync unique 1200x630 OG banners & ICO favicon (`generateAndSyncAssets`)
 *   2. Generate XML sitemap (`generateSitemapFiles`)
 *   3. Sync Cloudflare Pages `_redirects` from route discovery (`generateDeploymentArtifacts`)
 *   4. Prettier check (`npm run format:check`), TypeScript check (`npm run type-check`), & ESLint (`npm run lint`)
 *   5. Run Pre-build Validation Gate (fails fast before Vite compilation)
 *   6. Run Vite Client Build + Vite SSR Bundle Build
 *   7. Run SSG Prerenderer (`generatePrerenderedSite`) -> emits 13 HTML files + llms.txt
 *   8. Sync Cloudflare Pages `_headers` & `_redirects` into `dist/`
 *   9. Run Unit Test Suite with v8 Coverage (`npm run test:coverage`)
 *  10. Run Final Post-build Validation Gate (dist HTML, rendered content consistency,
 *      sitemap, unique assets, a11y, security, perf budgets, deployment, & 8-bot local HTTP crawl)
 *  11. Run Playwright E2E Verification against built `dist/` (`--project=e2e-prod`) when Chromium
 *      is available (or explicitly mark `NOT_RUN` on Cloudflare Pages `CF_PAGES=1` / `SKIP_E2E=1`)
 *  12. Emit machine-readable JSON + Markdown audit reports in `reports/`
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import type { ValidationReport } from '../../src/types/tool';
import { generateAndSyncAssets } from '../images/generate-assets';
import { generatePrerenderedSite } from '../prerender/generate-prerender';
import {
  generateAuditReports,
  type CoverageSummaryMetrics,
} from '../reports/generate-audit-report';
import { generateSitemapFiles } from '../sitemap/generate-sitemap';
import { generateDeploymentArtifacts } from '../tasks/deployment';
import { resolveFromRoot } from '../utils/file-utils';
import { runFinalValidation } from './final-validation';
import { runPrebuildValidation } from './prebuild-validation';

function runStepCommand(command: string, extraEnv: Record<string, string> = {}): void {
  console.log(`\n> ${command}`);
  execSync(command, {
    stdio: 'inherit',
    env: {
      ...process.env,
      ...extraEnv,
    },
  });
}

function makeSubprocessGateReport(validator: string): ValidationReport {
  return {
    validator,
    status: 'PASS',
    timestamp: new Date().toISOString(),
    checkedCount: 1,
    issues: [],
  };
}

function readCoverageSummary(): CoverageSummaryMetrics | null {
  const summaryPath = resolveFromRoot('coverage', 'coverage-summary.json');
  if (!fs.existsSync(summaryPath)) {
    return null;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(summaryPath, 'utf8')) as {
      total?: {
        lines?: { pct?: number };
        statements?: { pct?: number };
        functions?: { pct?: number };
        branches?: { pct?: number };
      };
    };
    const total = parsed.total;
    if (!total) return null;
    return {
      linesPct: total.lines?.pct ?? 0,
      statementsPct: total.statements?.pct ?? 0,
      functionsPct: total.functions?.pct ?? 0,
      branchesPct: total.branches?.pct ?? 0,
    };
  } catch {
    return null;
  }
}

function isTermuxOrAndroid(): boolean {
  return (
    process.platform === 'android' ||
    Boolean(process.env.TERMUX_VERSION) ||
    (process.env.PREFIX ?? '').includes('com.termux')
  );
}

function safeChromiumExecutablePath(): string | undefined {
  try {
    return chromium.executablePath();
  } catch {
    return undefined;
  }
}

function hasPlaywrightChromium(): boolean {
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    safeChromiumExecutablePath(),
    '/ms-playwright/chrome-headless-shell-linux64/chrome-headless-shell',
  ].filter((value): value is string => Boolean(value));

  return candidates.some((candidate) => fs.existsSync(candidate));
}

function runPlaywrightGate(): ValidationReport {
  const isCloudflarePages = process.env.CF_PAGES === '1';
  const isTermux = isTermuxOrAndroid();
  const skipE2E = process.env.SKIP_E2E === '1';
  const requireE2E = process.env.REQUIRE_E2E === '1';
  const chromiumInstalled = !isTermux && hasPlaywrightChromium();

  if (isCloudflarePages || isTermux || skipE2E || !chromiumInstalled) {
    const reason = isCloudflarePages
      ? 'Skipped in Cloudflare Pages build container (CF_PAGES=1); verified in GitHub Actions CI.'
      : isTermux
        ? 'Skipped in Termux/Android environment (Playwright Chromium requires glibc Linux; verified in GitHub Actions CI).'
        : skipE2E
          ? 'Skipped explicitly via SKIP_E2E=1.'
          : 'Playwright Chromium binary not found locally; run `npx playwright install --with-deps chromium`.';

    if (requireE2E) {
      throw new Error(`Playwright E2E gate required (REQUIRE_E2E=1) but unavailable: ${reason}`);
    }

    console.log(`\n[NOT_RUN] e2e:playwright — ${reason}`);
    return {
      validator: 'e2e:playwright',
      status: 'NOT_RUN',
      timestamp: new Date().toISOString(),
      checkedCount: 0,
      issues: [
        {
          code: 'E2E_NOT_RUN',
          severity: 'info',
          message: reason,
        },
      ],
    };
  }

  runStepCommand('npm run test:e2e -- --project=e2e-prod');
  return makeSubprocessGateReport('e2e:playwright');
}

export async function runProductionBuild(): Promise<void> {
  const startedAt = Date.now();
  const generatedAt = new Date().toISOString();

  console.log('=== Step 1: Generating Unique OG Images & Favicon ===');
  await generateAndSyncAssets();

  console.log('=== Step 2: Generating XML Sitemap ===');
  await generateSitemapFiles();

  console.log('=== Step 3: Generating Cloudflare Pages Redirects ===');
  await generateDeploymentArtifacts();

  console.log('=== Step 4: Running Prettier Check, TypeScript Check & ESLint ===');
  runStepCommand('npm run format:check');
  const prettierReport = makeSubprocessGateReport('build:prettier');

  runStepCommand('npm run type-check');
  const tcReport = makeSubprocessGateReport('build:type-check');

  runStepCommand('npm run lint');
  const lintReport = makeSubprocessGateReport('build:eslint');

  console.log('=== Step 5: Running Pre-Build Validation Gates ===');
  const prebuild = await runPrebuildValidation();
  if (!prebuild.passed) {
    throw new Error('Pre-build validation failed. Production build aborted.');
  }

  console.log('=== Step 6: Building Vite Client & SSR Bundles ===');
  const prodEnv = {
    NODE_ENV: 'production',
    VITE_SITE_URL: process.env.VITE_SITE_URL ?? 'https://ahadex.online',
  };
  runStepCommand('npm run build:client', prodEnv);
  runStepCommand('npm run build:ssr', prodEnv);

  console.log('=== Step 7: Prerendering Static HTML Pages & llms.txt ===');
  const prerenderSummary = await generatePrerenderedSite();
  console.log(
    `Prerendered ${prerenderSummary.outputFiles.length} HTML files for ${prerenderSummary.routeCount} routes.`,
  );

  console.log('=== Step 8: Syncing Cloudflare Pages Deployment Artifacts to dist/ ===');
  await generateDeploymentArtifacts();

  console.log('=== Step 9: Running Unit Test Suite with Coverage (Vitest) ===');
  runStepCommand('npm run test:coverage');
  const coverageSummary = readCoverageSummary();
  const unitTestReport = makeSubprocessGateReport('build:vitest-coverage');

  console.log('=== Step 10: Running Final Post-Build Validation & Full Crawler Simulation ===');
  const finalResult = await runFinalValidation();

  console.log('=== Step 11: Running Playwright E2E Verification (dist/ preview) ===');
  const e2eReport = runPlaywrightGate();

  const totalDurationMs = Date.now() - startedAt;
  const overallPassed = prebuild.passed && finalResult.passed && e2eReport.status !== 'FAIL';

  console.log('=== Step 12: Writing Audit & Post-Deploy Checklist Reports ===');
  const paths = await generateAuditReports({
    generatedAt,
    durationMs: totalDurationMs,
    prebuildReports: [prettierReport, tcReport, lintReport, ...prebuild.reports],
    finalReports: [unitTestReport, ...finalResult.reports, e2eReport],
    crawlerSimulation: finalResult.crawlerSimulation,
    coverageSummary,
    overallPassed,
  });

  if (!overallPassed) {
    throw new Error('Post-build validation failed. Inspect reports/build-summary.json.');
  }

  console.log(
    `\n[PASS] Production SSG build & quality gate succeeded in ${totalDurationMs}ms (e2e: ${e2eReport.status}).\nReports written: ${path.relative(process.cwd(), paths.auditSummaryMd)}, ${path.relative(process.cwd(), paths.buildSummary)}`,
  );
}

const isDirectExecution =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  await runProductionBuild();
}
