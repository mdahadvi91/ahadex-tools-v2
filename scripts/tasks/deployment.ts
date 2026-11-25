/**
 * Cloudflare Pages Deployment Configurator & Validator (Phase 11).
 *
 * Generates canonical trailing-slash 301 redirects in `public/_redirects` from
 * filesystem route discovery (plus apex `www.` normalization), copies `_headers`
 * and `_redirects` into `dist/`, and validates deployment readiness without
 * soft-404 catch-all anti-patterns.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_CONFIG } from '../../config/site.config';
import { STATIC_PAGE_ROUTES } from '../../src/config/static-routes';
import type { ValidationIssue, ValidationReport } from '../../src/types/tool';
import { fileExists, readTextFile, resolveFromRoot, writeTextFile } from '../utils/file-utils';
import { discoverPublishedRoutes } from '../utils/route-discovery';
import { assertReportPassed, createValidationReport } from '../utils/validation-utils';

const STATIC_ROUTE_PATHS = new Set(STATIC_PAGE_ROUTES.map((r) => r.path));

export function buildCloudflareRedirectsContent(
  routePaths: readonly string[],
  explicitToolSlugs?: readonly string[],
): string {
  const canonicalDomain = SITE_CONFIG.domain;
  const nonTrailingRedirects = routePaths
    .filter((p) => p !== '/' && p.endsWith('/'))
    .sort()
    .map((p) => `${p.replace(/\/+$/, '')} ${p} 301`);

  const toolSlugs = (
    explicitToolSlugs ??
    routePaths
      .filter((p) => p !== '/' && p.endsWith('/') && !STATIC_ROUTE_PATHS.has(p))
      .map((p) => p.replace(/^\/+|\/+$/g, ''))
  )
    .slice()
    .sort();

  const legacyToolRedirects = toolSlugs.flatMap((slug) => [
    `/tool/${slug} /${slug}/ 301`,
    `/tool/${slug}/ /${slug}/ 301`,
  ]);

  return [
    '# Canonical host redirect (www -> apex)',
    `https://www.${canonicalDomain}/* ${SITE_CONFIG.origin}/:splat 301`,
    '',
    '# Legacy /tool/* redirects -> canonical tool URLs (301)',
    ...legacyToolRedirects,
    '',
    '# Canonical trailing-slash redirects for static & tool routes',
    ...nonTrailingRedirects,
    '',
  ].join('\n');
}

export async function generateDeploymentArtifacts(
  options: {
    publicDir?: string;
    distDir?: string;
    toolsRoot?: string;
  } = {},
): Promise<{ redirectsPath: string; distSynced: string[] }> {
  const publicDir = options.publicDir ?? resolveFromRoot('public');
  const distDir = options.distDir ?? resolveFromRoot('dist');
  const routes = await discoverPublishedRoutes(options.toolsRoot);
  const toolSlugs = routes.filter((r) => r.kind === 'tool').map((r) => r.slug);
  const redirectsContent = buildCloudflareRedirectsContent(
    routes.map((r) => r.path),
    toolSlugs,
  );

  const redirectsPath = path.join(publicDir, '_redirects');
  writeTextFile(redirectsPath, redirectsContent);

  const distSynced: string[] = [];
  if (fileExists(distDir)) {
    const distRedirects = path.join(distDir, '_redirects');
    writeTextFile(distRedirects, redirectsContent);
    distSynced.push(path.relative(process.cwd(), distRedirects));

    const publicHeaders = path.join(publicDir, '_headers');
    if (fileExists(publicHeaders)) {
      const distHeaders = path.join(distDir, '_headers');
      writeTextFile(distHeaders, readTextFile(publicHeaders));
      distSynced.push(path.relative(process.cwd(), distHeaders));
    }
  }

  return { redirectsPath, distSynced };
}

export async function runDeploymentValidation(
  options: {
    distDir?: string;
    publicDir?: string;
    toolsRoot?: string;
  } = {},
): Promise<ValidationReport> {
  const distDir = options.distDir ?? resolveFromRoot('dist');
  const publicDir = options.publicDir ?? resolveFromRoot('public');
  const issues: ValidationIssue[] = [];
  let checkedCount = 0;

  const targetDir = fileExists(path.join(distDir, 'index.html')) ? distDir : publicDir;

  // 1. Validate _headers
  const headersPath = path.join(targetDir, '_headers');
  checkedCount++;
  if (!fileExists(headersPath)) {
    issues.push({
      code: 'DEPLOY_HEADERS_MISSING',
      severity: 'critical',
      target: headersPath,
      message: 'Cloudflare Pages _headers file is missing.',
    });
  } else {
    const headers = readTextFile(headersPath);
    if (!headers.includes('X-Content-Type-Options: nosniff')) {
      issues.push({
        code: 'DEPLOY_MISSING_NOSNIFF',
        severity: 'critical',
        target: headersPath,
        message: '_headers must set X-Content-Type-Options: nosniff.',
      });
    }
    if (
      !headers.includes('X-Frame-Options: DENY') &&
      !headers.includes('X-Frame-Options: SAMEORIGIN')
    ) {
      issues.push({
        code: 'DEPLOY_MISSING_FRAME_OPTIONS',
        severity: 'critical',
        target: headersPath,
        message: '_headers must set X-Frame-Options.',
      });
    }
    if (!headers.includes('Cache-Control: public, max-age=31536000, immutable')) {
      issues.push({
        code: 'DEPLOY_MISSING_IMMUTABLE_ASSETS',
        severity: 'warning',
        target: headersPath,
        message: '_headers should configure immutable long-lived caching for /assets/*.',
      });
    }
    if (!/\/404\.html[\s\S]*X-Robots-Tag:\s*noindex/i.test(headers)) {
      issues.push({
        code: 'DEPLOY_404_MISSING_NOINDEX_HEADER',
        severity: 'warning',
        target: headersPath,
        message: '_headers should set X-Robots-Tag: noindex, nofollow on /404.html.',
      });
    }
  }

  // 2. Validate _redirects
  const redirectsPath = path.join(targetDir, '_redirects');
  checkedCount++;
  if (!fileExists(redirectsPath)) {
    issues.push({
      code: 'DEPLOY_REDIRECTS_MISSING',
      severity: 'critical',
      target: redirectsPath,
      message: 'Cloudflare Pages _redirects file is missing.',
    });
  } else {
    const redirects = readTextFile(redirectsPath);
    if (/^\s*\/\*\s+\/index\.html\s+200\b/im.test(redirects)) {
      issues.push({
        code: 'DEPLOY_SPA_CATCHALL_SOFT404',
        severity: 'critical',
        target: redirectsPath,
        message:
          '_redirects contains "/* /index.html 200", which hijacks prerendered routes and causes soft-404s on Cloudflare Pages.',
      });
    }
    if (/https?:\/\/(?:localhost|127\.0\.0\.1)/i.test(redirects)) {
      issues.push({
        code: 'DEPLOY_REDIRECT_LOCALHOST_LEAK',
        severity: 'critical',
        target: redirectsPath,
        message: '_redirects contains a localhost URL.',
      });
    }

    const routes = await discoverPublishedRoutes(options.toolsRoot);
    for (const route of routes) {
      if (route.path === '/') continue;
      checkedCount++;
      const nonTrailing = route.path.replace(/\/+$/, '');
      const expectedRule = `${nonTrailing} ${route.path} 301`;
      if (!redirects.includes(expectedRule)) {
        issues.push({
          code: 'DEPLOY_MISSING_TRAILING_REDIRECT',
          severity: 'warning',
          target: route.path,
          message: `_redirects is missing canonical redirect "${expectedRule}".`,
        });
      }

      if (route.kind === 'tool') {
        for (const legacyPrefix of [`/tool/${route.slug}`, `/tool/${route.slug}/`]) {
          checkedCount++;
          const expectedLegacyRule = `${legacyPrefix} ${route.path} 301`;
          if (!redirects.includes(expectedLegacyRule)) {
            issues.push({
              code: 'DEPLOY_MISSING_LEGACY_TOOL_REDIRECT',
              severity: 'critical',
              target: legacyPrefix,
              message: `_redirects is missing legacy redirect "${expectedLegacyRule}".`,
            });
          }
        }
      }
    }
  }

  // 3. Validate essential static root deliverables in dist/ when present.
  if (fileExists(path.join(distDir, 'index.html'))) {
    for (const requiredFile of ['404.html', 'ads.txt', 'robots.txt', 'sitemap.xml', 'llms.txt']) {
      checkedCount++;
      const p = path.join(distDir, requiredFile);
      if (!fileExists(p)) {
        issues.push({
          code: 'DEPLOY_DIST_FILE_MISSING',
          severity: 'critical',
          target: `dist/${requiredFile}`,
          message: `Required deployment deliverable dist/${requiredFile} is missing.`,
        });
      }
    }
  }

  return createValidationReport('deployment:cloudflare-pages', checkedCount, issues);
}

const isDirectExecution =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  const shouldGenerate = process.argv.includes('--generate');
  const strict = process.argv.includes('--strict');
  if (shouldGenerate) {
    const generated = await generateDeploymentArtifacts();
    console.log(
      `[PASS] deployment:generate — wrote ${path.relative(process.cwd(), generated.redirectsPath)}` +
        (generated.distSynced.length > 0 ? ` and synced ${generated.distSynced.join(', ')}` : ''),
    );
  }
  const report = await runDeploymentValidation();
  assertReportPassed(report, strict);
}
