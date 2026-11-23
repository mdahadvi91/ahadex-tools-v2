/**
 * Route discovery and prerendered dist/ HTML verification script.
 * Validates pre-build route integrity (paths, uniqueness, no collisions)
 * and post-prerender static HTML output across every published route.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ValidationIssue, ValidationReport } from '../../src/types/tool';
import { fileExists, readTextFile, resolveFromRoot } from '../utils/file-utils';
import { discoverPublishedRoutes, discoverToolsFromFilesystem } from '../utils/route-discovery';
import { assertReportPassed, createValidationReport } from '../utils/validation-utils';

const RESERVED_PREFIXES = ['/assets/', '/og/', '/api/', '/_headers', '/_redirects'] as const;

export function routeToDistHtmlPath(routePath: string, distDir = resolveFromRoot('dist')): string {
  if (routePath === '/') {
    return path.join(distDir, 'index.html');
  }
  const clean = routePath.replace(/^\/+|\/+$/g, '');
  return path.join(distDir, clean, 'index.html');
}

export async function runRouteValidation(
  options: {
    toolsRoot?: string;
    distDir?: string;
    verifyDist?: boolean;
  } = {},
): Promise<ValidationReport> {
  const issues: ValidationIssue[] = [];
  const tools = await discoverToolsFromFilesystem(options.toolsRoot);
  const routes = await discoverPublishedRoutes(options.toolsRoot);
  const seenPaths = new Map<string, string>();
  let checkedCount = 0;

  for (const tool of tools) {
    checkedCount++;
    if (!tool.implemented) {
      issues.push({
        code: 'ROUTE_TOOL_UNINITIALIZED',
        severity: 'critical',
        target: `tool:${tool.slug}`,
        message: `Tool folder "${tool.slug}" is not implemented cleanly.`,
      });
    }
  }

  for (const route of routes) {
    checkedCount++;
    const target = `${route.kind}:${route.slug}`;

    if (route.path !== '/' && (!route.path.startsWith('/') || !route.path.endsWith('/'))) {
      issues.push({
        code: 'ROUTE_TRAILING_SLASH',
        severity: 'critical',
        target,
        message: `Route "${route.path}" must start and end with "/".`,
      });
    }

    if (RESERVED_PREFIXES.some((prefix) => route.path.startsWith(prefix))) {
      issues.push({
        code: 'ROUTE_RESERVED_COLLISION',
        severity: 'critical',
        target,
        message: `Route "${route.path}" collides with a reserved asset/system prefix.`,
      });
    }

    if (seenPaths.has(route.path)) {
      issues.push({
        code: 'ROUTE_DUPLICATE_PATH',
        severity: 'critical',
        target,
        message: `Duplicate route path "${route.path}" also claimed by ${seenPaths.get(route.path)}.`,
      });
    } else {
      seenPaths.set(route.path, target);
    }

    if (options.verifyDist) {
      const htmlPath = routeToDistHtmlPath(route.path, options.distDir);
      if (!fileExists(htmlPath)) {
        issues.push({
          code: 'PRERENDER_HTML_MISSING',
          severity: 'critical',
          target,
          message: `Missing prerendered HTML output: ${htmlPath}`,
          hint: 'Run `npm run prerender` after `npm run build:client && npm run build:ssr`.',
        });
        continue;
      }

      const html = readTextFile(htmlPath);
      if (!html.includes('data-prerender-ready="true"')) {
        issues.push({
          code: 'PRERENDER_NOT_READY',
          severity: 'critical',
          target,
          message: `${htmlPath} is missing data-prerender-ready="true".`,
        });
      }
      if (html.includes('<div id="root"></div>')) {
        issues.push({
          code: 'PRERENDER_EMPTY_ROOT',
          severity: 'critical',
          target,
          message: `${htmlPath} still contains an empty <div id="root"></div>.`,
        });
      }
      if (!html.includes(`<link rel="canonical" href="${route.canonicalUrl}"`)) {
        issues.push({
          code: 'PRERENDER_MISSING_CANONICAL',
          severity: 'critical',
          target,
          message: `${htmlPath} does not declare <link rel="canonical" href="${route.canonicalUrl}" />.`,
        });
      }
      if (!/<title>.+<\/title>/s.test(html)) {
        issues.push({
          code: 'PRERENDER_MISSING_TITLE',
          severity: 'critical',
          target,
          message: `${htmlPath} is missing a populated <title> tag.`,
        });
      }
      if (!/<meta\s+name="description"\s+content="[^"]+"/i.test(html)) {
        issues.push({
          code: 'PRERENDER_MISSING_DESCRIPTION',
          severity: 'critical',
          target,
          message: `${htmlPath} is missing a populated meta description.`,
        });
      }
      if (!/<h1[\s>]/i.test(html)) {
        issues.push({
          code: 'PRERENDER_MISSING_H1',
          severity: 'critical',
          target,
          message: `${htmlPath} has no rendered <h1> heading in static HTML.`,
        });
      }
      if (/https?:\/\/(?:localhost|127\.0\.0\.1)/i.test(html)) {
        issues.push({
          code: 'PRERENDER_LOCALHOST_LEAK',
          severity: 'critical',
          target,
          message: `${htmlPath} contains a localhost URL in prerendered HTML or JSON-LD.`,
          hint: 'Ensure production origin https://ahadex.online is used during SSR rendering.',
        });
      }
    }
  }

  return createValidationReport(
    options.verifyDist ? 'routes:dist-html' : 'routes:discovery',
    checkedCount,
    issues,
  );
}

const isDirectExecution =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  const verifyDist = process.argv.includes('--verify-dist');
  const strict = process.argv.includes('--strict');
  const report = await runRouteValidation({ verifyDist });
  assertReportPassed(report, strict);
}
