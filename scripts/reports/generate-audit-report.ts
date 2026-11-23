/**
 * Audit Report Generator for AHADEX Tools (Phase 10 & Phase 11).
 *
 * Emits structured machine-readable JSON reports and a human-readable Markdown
 * summary inside `reports/`, explicitly distinguishing verified local/build checks
 * from post-deploy external live checks (status: NOT_RUN).
 */

import path from 'node:path';
import { SITE_CONFIG } from '../../config/site.config';
import type { ValidationReport } from '../../src/types/tool';
import type { CrawlerSimulationResult } from '../crawlers/simulate-crawlers';
import { collectDiscoverySnapshot } from '../discovery/discover-tools';
import { resolveFromRoot, writeTextFile } from '../utils/file-utils';

export interface BuildReportInput {
  readonly generatedAt: string;
  readonly durationMs: number;
  readonly prebuildReports: readonly ValidationReport[];
  readonly finalReports: readonly ValidationReport[];
  readonly crawlerSimulation: CrawlerSimulationResult;
  readonly overallPassed: boolean;
}

export interface GeneratedReportPaths {
  readonly seoReport: string;
  readonly routeReport: string;
  readonly crawlerReport: string;
  readonly buildSummary: string;
  readonly auditSummaryMd: string;
  readonly postDeployChecklistMd: string;
}

export async function generateAuditReports(
  input: BuildReportInput,
  reportsDir: string = resolveFromRoot('reports'),
): Promise<GeneratedReportPaths> {
  const discovery = await collectDiscoverySnapshot();
  const allReports = [...input.prebuildReports, ...input.finalReports];

  const seoReportPath = path.join(reportsDir, 'seo-report.json');
  const routeReportPath = path.join(reportsDir, 'route-report.json');
  const crawlerReportPath = path.join(reportsDir, 'crawler-report.json');
  const buildSummaryPath = path.join(reportsDir, 'build-summary.json');
  const auditSummaryMdPath = path.join(reportsDir, 'audit-summary.md');
  const postDeployChecklistMdPath = path.join(reportsDir, 'post-deploy-checklist.md');

  const seoValidators = allReports.filter(
    (r) =>
      r.validator.startsWith('seo:') ||
      r.validator.startsWith('content:') ||
      r.validator.startsWith('sitemap:') ||
      r.validator.startsWith('robots:'),
  );
  writeTextFile(
    seoReportPath,
    `${JSON.stringify(
      {
        site: SITE_CONFIG.origin,
        generatedAt: input.generatedAt,
        validators: seoValidators,
      },
      null,
      2,
    )}\n`,
  );

  writeTextFile(
    routeReportPath,
    `${JSON.stringify(
      {
        generatedAt: input.generatedAt,
        liveToolsCount: discovery.liveToolsCount,
        routesCount: discovery.routesCount,
        tools: discovery.tools,
        routes: discovery.routes,
      },
      null,
      2,
    )}\n`,
  );

  writeTextFile(crawlerReportPath, `${JSON.stringify(input.crawlerSimulation, null, 2)}\n`);

  const criticalCount = allReports.reduce(
    (sum, r) => sum + r.issues.filter((i) => i.severity === 'critical').length,
    0,
  );
  const warningCount = allReports.reduce(
    (sum, r) => sum + r.issues.filter((i) => i.severity === 'warning').length,
    0,
  );

  writeTextFile(
    buildSummaryPath,
    `${JSON.stringify(
      {
        project: SITE_CONFIG.name,
        origin: SITE_CONFIG.origin,
        generatedAt: input.generatedAt,
        status: input.overallPassed ? 'PASS' : 'FAIL',
        durationMs: input.durationMs,
        criticalCount,
        warningCount,
        checks: allReports.map((r) => ({
          validator: r.validator,
          status: r.status,
          checkedCount: r.checkedCount,
          issuesCount: r.issues.length,
        })),
        externalChecksStatus: 'NOT_RUN (requires live Cloudflare Pages URL)',
      },
      null,
      2,
    )}\n`,
  );

  const checkRows = allReports
    .map(
      (r) =>
        `| \`${r.validator}\` | **${r.status}** | ${r.checkedCount} | ${r.issues.filter((i) => i.severity === 'critical').length} | ${r.issues.filter((i) => i.severity === 'warning').length} |`,
    )
    .join('\n');

  const auditMarkdown = [
    `# AHADEX Tools Build & Audit Summary`,
    '',
    `- **Generated At**: ${input.generatedAt}`,
    `- **Target Origin**: ${SITE_CONFIG.origin}`,
    `- **Overall Local Build Status**: **${input.overallPassed ? 'PASS' : 'FAIL'}** (${input.durationMs} ms)`,
    `- **Discovered Live Tools**: ${discovery.liveToolsCount} (${discovery.routesCount} total published routes)`,
    `- **Crawler Mode**: \`${input.crawlerSimulation.mode}\` (\`externalNetworkVerified: ${input.crawlerSimulation.externalNetworkVerified}\`)`,
    '',
    '## Automated Verification Gate Results',
    '',
    '| Gate | Status | Checked | Critical | Warnings |',
    '| :--- | :--- | ---: | ---: | ---: |',
    checkRows,
    '',
    '## Post-Deploy External Checks (NOT RUN LOCALLY)',
    '',
    '> External Google/Cloudflare/AdSense verification cannot execute offline before publishing to `https://ahadex.online`. See `reports/post-deploy-checklist.md`.',
    '',
  ].join('\n');
  writeTextFile(auditSummaryMdPath, auditMarkdown);

  const checklistMarkdown = [
    `# AHADEX Tools — Cloudflare Pages Post-Deploy Checklist`,
    '',
    `**Status**: \`NOT_RUN\` (execute manually after connecting GitHub repo to Cloudflare Pages and deploying \`dist/\` to \`${SITE_CONFIG.origin}\`).`,
    '',
    '## Cloudflare Pages Build Settings',
    '- **Build command**: `npm run build`',
    '- **Build output directory**: `dist`',
    '- **Environment variable**: `NODE_VERSION=24` (matches `.nvmrc` `24`) and `VITE_SITE_URL=https://ahadex.online`',
    '',
    '## Live Post-Deploy Verification Steps',
    '- [ ] **HTTP Redirects & TLS (`curl -I`)**: Confirm `http://ahadex.online`, `https://www.ahadex.online/`, and `/pdf-compressor` redirect `301` cleanly to `https://ahadex.online/.../` without redirect chains.',
    '- [ ] **Security Headers & Cache**: Inspect live response headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `/assets/*` immutable cache, `/404.html` `X-Robots-Tag: noindex, nofollow`, true HTTP `404` status on unknown URLs).',
    '- [ ] **View Source (No-JS Crawlability)**: Fetch `curl -s https://ahadex.online/pdf-compressor/` and confirm populated `<div id="root">`, canonical `<link>`, Open Graph tags, and JSON-LD without JS.',
    '- [ ] **Google Search Console**: Submit `https://ahadex.online/sitemap.xml` and run Live URL Inspection on `/`, `/image-compressor/`, and `/pdf-compressor/`.',
    '- [ ] **Bing Webmaster Tools**: Verify ownership and submit `https://ahadex.online/sitemap.xml`.',
    '- [ ] **Rich Results Test**: Test live tool URLs in Google Rich Results Test (`WebApplication`, `FAQPage`, `BreadcrumbList`).',
    '- [ ] **PageSpeed Insights**: Measure live mobile & desktop Core Web Vitals (LCP, INP, CLS).',
    '- [ ] **Google AdSense Readiness**: Confirm `https://ahadex.online/ads.txt` returns `200`, legal pages (`/privacy-policy/`, `/terms/`, `/disclaimer/`, `/cookie-policy/`, `/about/`, `/contact/`) resolve, and organic editorial value exceeds ad density.',
    '',
  ].join('\n');
  writeTextFile(postDeployChecklistMdPath, checklistMarkdown);

  return {
    seoReport: seoReportPath,
    routeReport: routeReportPath,
    crawlerReport: crawlerReportPath,
    buildSummary: buildSummaryPath,
    auditSummaryMd: auditSummaryMdPath,
    postDeployChecklistMd: postDeployChecklistMdPath,
  };
}
