/**
 * Unified Production Build Orchestrator for AHADEX Tools (Phase 10).
 *
 * Executes the complete deterministic static site build pipeline:
 *   1. Generate/sync OG & icon assets (`generateAssets`)
 *   2. Generate XML sitemap (`generateSitemapFiles`)
 *   3. Sync Cloudflare Pages `_redirects` from route discovery (`generateDeploymentArtifacts`)
 *   4. Run Pre-build Validation Gate (fails fast before Vite compilation if SEO/routes break)
 *   5. Run Vite Client Build + Vite SSR Bundle Build
 *   6. Run SSG Prerenderer (`generatePrerenderedSite`) -> emits 13 HTML files + llms.txt
 *   7. Sync Cloudflare Pages `_headers` & `_redirects` into `dist/`
 *   8. Run Final Post-build Validation Gate (dist HTML, sitemap, assets, a11y, security, perf, deployment, local crawlers)
 *   9. Emit machine-readable JSON + Markdown audit reports in `reports/`
 */

import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateAndSyncAssets } from '../images/generate-assets';
import { generatePrerenderedSite } from '../prerender/generate-prerender';
import { generateAuditReports } from '../reports/generate-audit-report';
import { generateSitemapFiles } from '../sitemap/generate-sitemap';
import { generateDeploymentArtifacts } from '../tasks/deployment';
import { runFinalValidation } from './final-validation';
import { runPrebuildValidation } from './prebuild-validation';

function runStepCommand(command: string): void {
  console.log(`\n> ${command}`);
  execSync(command, {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      VITE_SITE_URL: process.env.VITE_SITE_URL ?? 'https://ahadex.online',
    },
  });
}

export async function runProductionBuild(): Promise<void> {
  const startedAt = Date.now();
  const generatedAt = new Date().toISOString();

  console.log('=== Step 1: Generating Branded OG/Icon Assets ===');
  await generateAndSyncAssets();

  console.log('=== Step 2: Generating XML Sitemap ===');
  await generateSitemapFiles();

  console.log('=== Step 3: Generating Cloudflare Pages Redirects ===');
  await generateDeploymentArtifacts();

  console.log('=== Step 4: Running Pre-Build Validation Gates ===');
  const prebuild = await runPrebuildValidation();
  if (!prebuild.passed) {
    throw new Error('Pre-build validation failed. Production build aborted.');
  }

  console.log('=== Step 5: Building Vite Client & SSR Bundles ===');
  runStepCommand('npm run build:client');
  runStepCommand('npm run build:ssr');

  console.log('=== Step 6: Prerendering Static HTML Pages & llms.txt ===');
  const prerenderSummary = await generatePrerenderedSite();
  console.log(
    `Prerendered ${prerenderSummary.outputFiles.length} HTML files for ${prerenderSummary.routeCount} routes.`,
  );

  console.log('=== Step 7: Syncing Cloudflare Pages Deployment Artifacts to dist/ ===');
  await generateDeploymentArtifacts();

  console.log('=== Step 8: Running Final Post-Build Validation & Crawler Simulation ===');
  const finalResult = await runFinalValidation();
  const totalDurationMs = Date.now() - startedAt;

  console.log('=== Step 9: Writing Audit & Post-Deploy Checklist Reports ===');
  const paths = await generateAuditReports({
    generatedAt,
    durationMs: totalDurationMs,
    prebuildReports: prebuild.reports,
    finalReports: finalResult.reports,
    crawlerSimulation: finalResult.crawlerSimulation,
    overallPassed: prebuild.passed && finalResult.passed,
  });

  if (!finalResult.passed) {
    throw new Error('Post-build validation failed. Inspect reports/build-summary.json.');
  }

  console.log(
    `\n[PASS] Production SSG build & audit succeeded in ${totalDurationMs}ms.\nReports written: ${path.relative(process.cwd(), paths.auditSummaryMd)}, ${path.relative(process.cwd(), paths.buildSummary)}`,
  );
}

const isDirectExecution =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  await runProductionBuild();
}
