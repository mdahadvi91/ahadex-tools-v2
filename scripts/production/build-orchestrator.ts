/**
 * Unified Production Build Orchestrator for AHADEX Tools (P1 / Phase 10).
 *
 * Executes the complete deterministic static site build and quality gate:
 *   1. Generate/sync unique 1200x630 OG banners & ICO favicon (`generateAndSyncAssets`)
 *   2. Generate XML sitemap (`generateSitemapFiles`)
 *   3. Sync Cloudflare Pages `_redirects` from route discovery (`generateDeploymentArtifacts`)
 *   4. TypeScript type-check (`npm run type-check`) & ESLint (`npm run lint`)
 *   5. Run Pre-build Validation Gate (fails fast before Vite compilation)
 *   6. Run Vite Client Build + Vite SSR Bundle Build
 *   7. Run SSG Prerenderer (`generatePrerenderedSite`) -> emits 13 HTML files + llms.txt
 *   8. Sync Cloudflare Pages `_headers` & `_redirects` into `dist/`
 *   9. Run Unit Test Suite (`npm test`)
 *  10. Run Final Post-build Validation Gate (dist HTML, rendered content consistency,
 *      sitemap, unique assets, a11y, security, perf budgets, deployment, & 8-bot local HTTP crawl)
 *  11. Emit machine-readable JSON + Markdown audit reports in `reports/`
 */

import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ValidationReport } from '../../src/types/tool';
import { generateAndSyncAssets } from '../images/generate-assets';
import { generatePrerenderedSite } from '../prerender/generate-prerender';
import { generateAuditReports } from '../reports/generate-audit-report';
import { generateSitemapFiles } from '../sitemap/generate-sitemap';
import { generateDeploymentArtifacts } from '../tasks/deployment';
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

export async function runProductionBuild(): Promise<void> {
  const startedAt = Date.now();
  const generatedAt = new Date().toISOString();

  console.log('=== Step 1: Generating Unique OG Images & Favicon ===');
  await generateAndSyncAssets();

  console.log('=== Step 2: Generating XML Sitemap ===');
  await generateSitemapFiles();

  console.log('=== Step 3: Generating Cloudflare Pages Redirects ===');
  await generateDeploymentArtifacts();

  console.log('=== Step 4: Running TypeScript Check & ESLint ===');
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

  console.log('=== Step 9: Running Unit Test Suite (Vitest) ===');
  runStepCommand('npm test');
  const unitTestReport = makeSubprocessGateReport('build:vitest');

  console.log('=== Step 10: Running Final Post-Build Validation & Full Crawler Simulation ===');
  const finalResult = await runFinalValidation();
  const totalDurationMs = Date.now() - startedAt;

  console.log('=== Step 11: Writing Audit & Post-Deploy Checklist Reports ===');
  const paths = await generateAuditReports({
    generatedAt,
    durationMs: totalDurationMs,
    prebuildReports: [tcReport, lintReport, ...prebuild.reports],
    finalReports: [unitTestReport, ...finalResult.reports],
    crawlerSimulation: finalResult.crawlerSimulation,
    overallPassed: prebuild.passed && finalResult.passed,
  });

  if (!finalResult.passed) {
    throw new Error('Post-build validation failed. Inspect reports/build-summary.json.');
  }

  console.log(
    `\n[PASS] Production SSG build & full quality gate succeeded in ${totalDurationMs}ms.\nReports written: ${path.relative(process.cwd(), paths.auditSummaryMd)}, ${path.relative(process.cwd(), paths.buildSummary)}`,
  );
}

const isDirectExecution =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  await runProductionBuild();
}
