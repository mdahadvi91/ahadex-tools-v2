/**
 * Canonical URL and trailing-slash policy validator.
 * Verifies authoritative HTTPS origin (https://ahadex.online),
 * trailing-slash consistency across static pages and live tools,
 * environment fallback safety, and zero duplicate/malformed canonical URLs.
 */

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  SITE_CONFIG,
  STATIC_PAGE_ROUTES,
  buildCanonicalUrl,
  normalizeRoutePath,
} from '../../config/site.config';
import { getEnvironment } from '../../src/config/environment';
import type { PageMetadata } from '../../src/platform/seo/metadata';
import type { ToolMetadata, ValidationIssue, ValidationReport } from '../../src/types/tool';
import { fileExists } from '../utils/file-utils';
import { discoverPublishedRoutes, discoverToolsFromFilesystem } from '../utils/route-discovery';
import {
  assertReportPassed,
  createValidationReport,
  isAbsoluteHttpsUrl,
} from '../utils/validation-utils';

export function hasTrailingSlashPolicyViolation(routePath: string): boolean {
  if (routePath === '/') return false;
  return !routePath.startsWith('/') || !routePath.endsWith('/') || routePath.includes('//');
}

export async function runCanonicalValidation(toolsRoot?: string): Promise<ValidationReport> {
  const issues: ValidationIssue[] = [];
  const seenCanonicals = new Map<string, string>();
  let checkedCount = 0;

  checkedCount++;
  if (!isAbsoluteHttpsUrl(SITE_CONFIG.origin)) {
    issues.push({
      code: 'CANONICAL_INVALID_ORIGIN',
      severity: 'critical',
      target: 'SITE_CONFIG.origin',
      message: `SITE_CONFIG.origin must be a valid HTTPS URL (found "${SITE_CONFIG.origin}").`,
    });
  }
  if (SITE_CONFIG.origin.includes('www.')) {
    issues.push({
      code: 'CANONICAL_WWW_DRIFT',
      severity: 'critical',
      target: 'SITE_CONFIG.origin',
      message: 'Primary origin must be apex domain https://ahadex.online without www.',
    });
  }

  checkedCount++;
  const env = getEnvironment();
  if (!env.siteUrl || env.siteUrl.includes('example.com')) {
    issues.push({
      code: 'CANONICAL_ENV_PLACEHOLDER',
      severity: 'critical',
      target: 'src/config/environment.ts',
      message: `Environment siteUrl is missing or uses a placeholder ("${env.siteUrl}").`,
    });
  }

  for (const page of STATIC_PAGE_ROUTES) {
    checkedCount++;
    const target = `static:${page.slug}`;
    if (hasTrailingSlashPolicyViolation(page.path)) {
      issues.push({
        code: 'CANONICAL_TRAILING_SLASH',
        severity: 'critical',
        target,
        message: `Static route "${page.path}" violates trailing-slash URL policy.`,
      });
    }
    const canonical = buildCanonicalUrl(page.path);
    if (seenCanonicals.has(canonical)) {
      issues.push({
        code: 'CANONICAL_DUPLICATE',
        severity: 'critical',
        target,
        message: `Duplicate canonical URL "${canonical}" collides with ${seenCanonicals.get(canonical)}.`,
      });
    } else {
      seenCanonicals.set(canonical, target);
    }
  }

  const tools = await discoverToolsFromFilesystem(toolsRoot);
  for (const tool of tools) {
    if (!tool.implemented) continue;
    checkedCount++;
    const target = `tool:${tool.slug}`;

    if (hasTrailingSlashPolicyViolation(tool.routePath)) {
      issues.push({
        code: 'CANONICAL_TRAILING_SLASH',
        severity: 'critical',
        target,
        message: `Tool route "${tool.routePath}" violates trailing-slash policy.`,
      });
    }

    const expectedCanonical = buildCanonicalUrl(normalizeRoutePath(`/${tool.slug}/`));
    if (tool.canonicalUrl !== expectedCanonical) {
      issues.push({
        code: 'CANONICAL_MISMATCH',
        severity: 'critical',
        target,
        message: `Discovered canonical "${tool.canonicalUrl}" does not match "${expectedCanonical}".`,
      });
    }

    const metaPath = path.join(tool.directory, 'metadata.ts');
    if (fileExists(metaPath)) {
      const mod = (await import(pathToFileURL(metaPath).href)) as { metadata?: ToolMetadata };
      if (mod.metadata?.canonical !== expectedCanonical) {
        issues.push({
          code: 'CANONICAL_METADATA_DRIFT',
          severity: 'critical',
          target: `${target}:metadata.ts`,
          message: `metadata.canonical ("${mod.metadata?.canonical}") !== "${expectedCanonical}".`,
        });
      }
    }

    const seoPath = path.join(tool.directory, 'seo.ts');
    if (fileExists(seoPath)) {
      const mod = (await import(pathToFileURL(seoPath).href)) as { metadata?: PageMetadata };
      const seoCanonicalPath = mod.metadata?.canonicalPath ?? mod.metadata?.path;
      if (seoCanonicalPath !== tool.routePath) {
        issues.push({
          code: 'CANONICAL_SEO_PATH_DRIFT',
          severity: 'critical',
          target: `${target}:seo.ts`,
          message: `seo.canonicalPath ("${seoCanonicalPath}") !== "${tool.routePath}".`,
        });
      }
      if (mod.metadata?.ogImage && mod.metadata.ogImage.includes('www.')) {
        issues.push({
          code: 'CANONICAL_OG_WWW_DRIFT',
          severity: 'critical',
          target: `${target}:seo.ts`,
          message: `seo.ogImage uses www host ("${mod.metadata.ogImage}").`,
        });
      }
    }

    if (seenCanonicals.has(tool.canonicalUrl)) {
      issues.push({
        code: 'CANONICAL_DUPLICATE',
        severity: 'critical',
        target,
        message: `Duplicate canonical "${tool.canonicalUrl}" collides with ${seenCanonicals.get(tool.canonicalUrl)}.`,
      });
    } else {
      seenCanonicals.set(tool.canonicalUrl, target);
    }
  }

  const published = await discoverPublishedRoutes(toolsRoot);
  if (published.length < STATIC_PAGE_ROUTES.length + 1) {
    issues.push({
      code: 'CANONICAL_TOO_FEW_ROUTES',
      severity: 'critical',
      message: 'Published route list contains fewer routes than expected.',
    });
  }

  return createValidationReport('seo:canonical', checkedCount, issues);
}

const isDirectExecution =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  const strict = process.argv.includes('--strict');
  const report = await runCanonicalValidation();
  assertReportPassed(report, strict);
}
