/**
 * XML Sitemap validator.
 * Audits public/sitemap.xml (and dist/sitemap.xml if present) against
 * discovered published routes, checking HTTPS apex origin, trailing slashes,
 * duplicate entries, non-indexable exclusions, and prerendered HTML alignment.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_CONFIG } from '../../config/site.config';
import type { ValidationIssue, ValidationReport } from '../../src/types/tool';
import { fileExists, readTextFile, resolveFromRoot } from '../utils/file-utils';
import { discoverPublishedRoutes } from '../utils/route-discovery';
import { assertReportPassed, createValidationReport } from '../utils/validation-utils';
import { routeToDistHtmlPath } from '../validation/validate-routes';

export function extractSitemapLocs(xml: string): string[] {
  const locs: string[] = [];
  const regex = /<loc>\s*([^<\s]+)\s*<\/loc>/g;
  let match: RegExpExecArray | null = regex.exec(xml);
  while (match) {
    locs.push(match[1]);
    match = regex.exec(xml);
  }
  return locs;
}

export async function runSitemapValidation(
  options: {
    sitemapPath?: string;
    distDir?: string;
    toolsRoot?: string;
    verifyDist?: boolean;
  } = {},
): Promise<ValidationReport> {
  const issues: ValidationIssue[] = [];
  const sitemapPath = options.sitemapPath ?? resolveFromRoot('public', 'sitemap.xml');
  const distDir = options.distDir ?? resolveFromRoot('dist');
  let checkedCount = 0;

  if (!fileExists(sitemapPath)) {
    issues.push({
      code: 'SITEMAP_MISSING',
      severity: 'critical',
      target: sitemapPath,
      message: 'public/sitemap.xml does not exist. Run `npm run generate:sitemap`.',
    });
    return createValidationReport('sitemap:xml', 1, issues);
  }

  const xml = readTextFile(sitemapPath);
  checkedCount++;

  if (!xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) {
    issues.push({
      code: 'SITEMAP_INVALID_ROOT',
      severity: 'critical',
      target: sitemapPath,
      message: 'sitemap.xml is missing valid <urlset> namespace declaration.',
    });
  }

  const locs = extractSitemapLocs(xml);
  if (locs.length === 0) {
    issues.push({
      code: 'SITEMAP_EMPTY',
      severity: 'critical',
      target: sitemapPath,
      message: 'sitemap.xml contains zero <loc> entries.',
    });
  }

  const seenLocs = new Set<string>();
  const routes = await discoverPublishedRoutes(options.toolsRoot);
  const expectedSitemapRoutes = routes.filter((r) => r.indexable && r.sitemap);
  const expectedLocSet = new Set(expectedSitemapRoutes.map((r) => r.canonicalUrl));

  for (const loc of locs) {
    checkedCount++;
    if (!loc.startsWith(`${SITE_CONFIG.origin}/`)) {
      issues.push({
        code: 'SITEMAP_ORIGIN_DRIFT',
        severity: 'critical',
        target: loc,
        message: `Sitemap URL "${loc}" does not start with "${SITE_CONFIG.origin}/".`,
      });
      continue;
    }
    if (loc.includes('www.')) {
      issues.push({
        code: 'SITEMAP_WWW_DRIFT',
        severity: 'critical',
        target: loc,
        message: `Sitemap URL "${loc}" uses deprecated www subdomain.`,
      });
    }
    const urlObj = new URL(loc);
    if (urlObj.pathname !== '/' && !urlObj.pathname.endsWith('/')) {
      issues.push({
        code: 'SITEMAP_NO_TRAILING_SLASH',
        severity: 'critical',
        target: loc,
        message: `Sitemap URL "${loc}" is missing required trailing slash.`,
      });
    }
    if (seenLocs.has(loc)) {
      issues.push({
        code: 'SITEMAP_DUPLICATE_LOC',
        severity: 'critical',
        target: loc,
        message: `Duplicate sitemap URL: "${loc}".`,
      });
    }
    seenLocs.add(loc);

    if (!expectedLocSet.has(loc)) {
      issues.push({
        code: 'SITEMAP_UNEXPECTED_URL',
        severity: 'critical',
        target: loc,
        message: `Sitemap contains "${loc}", which is not marked indexable & sitemap-enabled in discovered routes.`,
      });
    }

    if (options.verifyDist) {
      const htmlPath = routeToDistHtmlPath(urlObj.pathname, distDir);
      if (!fileExists(htmlPath)) {
        issues.push({
          code: 'SITEMAP_MISSING_DIST_HTML',
          severity: 'critical',
          target: loc,
          message: `Sitemap URL "${loc}" has no prerendered HTML at ${htmlPath}.`,
        });
      } else {
        const html = readTextFile(htmlPath);
        if (/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html)) {
          issues.push({
            code: 'SITEMAP_NOINDEX_CONFLICT',
            severity: 'critical',
            target: loc,
            message: `Sitemap URL "${loc}" HTML has noindex directive.`,
          });
        }
      }
    }
  }

  for (const expected of expectedSitemapRoutes) {
    if (!seenLocs.has(expected.canonicalUrl)) {
      issues.push({
        code: 'SITEMAP_MISSING_ROUTE',
        severity: 'critical',
        target: expected.canonicalUrl,
        message: `Published indexable route "${expected.canonicalUrl}" is missing from sitemap.xml.`,
      });
    }
  }

  return createValidationReport('sitemap:xml', checkedCount, issues);
}

const isDirectExecution =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  const verifyDist = process.argv.includes('--verify-dist');
  const strict = process.argv.includes('--strict');
  const report = await runSitemapValidation({ verifyDist });
  assertReportPassed(report, strict);
}
