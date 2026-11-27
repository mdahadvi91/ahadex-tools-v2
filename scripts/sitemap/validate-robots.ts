/**
 * Validator for public/robots.txt and public/llms.txt.
 * Verifies valid crawler directives, authoritative HTTPS Sitemap pointer,
 * zero accidental root disallow rules, and complete llms.txt tool coverage.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_CONFIG } from '../../config/site.config';
import type { ValidationIssue, ValidationReport } from '../../src/types/tool';
import { fileExists, readTextFile, resolveFromRoot } from '../utils/file-utils';
import { discoverPublishedRoutes } from '../utils/route-discovery';
import { assertReportPassed, createValidationReport } from '../utils/validation-utils';

export async function runRobotsAndLlmsValidation(
  options: {
    robotsPath?: string;
    llmsPath?: string;
    toolsRoot?: string;
  } = {},
): Promise<ValidationReport> {
  const issues: ValidationIssue[] = [];
  const robotsPath = options.robotsPath ?? resolveFromRoot('public', 'robots.txt');
  const llmsPath = options.llmsPath ?? resolveFromRoot('public', 'llms.txt');
  let checkedCount = 0;

  checkedCount++;
  if (!fileExists(robotsPath)) {
    issues.push({
      code: 'ROBOTS_MISSING',
      severity: 'critical',
      target: robotsPath,
      message: 'public/robots.txt is missing.',
    });
  } else {
    const robots = readTextFile(robotsPath);
    if (!/User-agent:\s*\*/i.test(robots)) {
      issues.push({
        code: 'ROBOTS_NO_WILDCARD_AGENT',
        severity: 'critical',
        target: robotsPath,
        message: 'robots.txt must declare a "User-agent: *" block.',
      });
    }
    if (/^\s*Disallow:\s*\/\s*$/im.test(robots)) {
      issues.push({
        code: 'ROBOTS_BLOCKS_ALL',
        severity: 'critical',
        target: robotsPath,
        message: 'robots.txt contains a global "Disallow: /" rule that blocks indexing.',
      });
    }
    if (robots.includes('www.')) {
      issues.push({
        code: 'ROBOTS_WWW_DRIFT',
        severity: 'critical',
        target: robotsPath,
        message: 'robots.txt references www. subdomain instead of apex https://ahadex.online.',
      });
    }

    const expectedSitemapDirective = `Sitemap: ${SITE_CONFIG.origin}/sitemap.xml`;
    if (!robots.includes(expectedSitemapDirective)) {
      issues.push({
        code: 'ROBOTS_SITEMAP_MISMATCH',
        severity: 'critical',
        target: robotsPath,
        message: `robots.txt must include exact line "${expectedSitemapDirective}".`,
      });
    }

    for (const agent of [
      'Googlebot',
      'Mediapartners-Google',
      'Bingbot',
      'Yandex',
      'OAI-SearchBot',
      'PerplexityBot',
    ]) {
      checkedCount++;
      if (!robots.includes(`User-agent: ${agent}`)) {
        issues.push({
          code: 'ROBOTS_MISSING_EXPLICIT_AGENT',
          severity: 'warning',
          target: robotsPath,
          message: `robots.txt should explicitly welcome User-agent: ${agent}.`,
        });
      }
    }
  }

  checkedCount++;
  if (!fileExists(llmsPath)) {
    issues.push({
      code: 'LLMS_MISSING',
      severity: 'critical',
      target: llmsPath,
      message: 'public/llms.txt is missing. Run prerender or llms generation.',
    });
  } else {
    const llms = readTextFile(llmsPath);
    if (!llms.includes(SITE_CONFIG.name) || !llms.includes(`${SITE_CONFIG.origin}/`)) {
      issues.push({
        code: 'LLMS_HEADER_INVALID',
        severity: 'critical',
        target: llmsPath,
        message: 'llms.txt must reference AHADEX Tools and https://ahadex.online/.',
      });
    }
    if (llms.includes('/tools/') || llms.includes('www.')) {
      issues.push({
        code: 'LLMS_STALE_PATHS',
        severity: 'critical',
        target: llmsPath,
        message: 'llms.txt contains deprecated /tools/ or www. URLs.',
      });
    }

    const routes = await discoverPublishedRoutes(options.toolsRoot);
    const liveTools = routes.filter((r) => r.kind === 'tool' && r.indexable);
    for (const tool of liveTools) {
      checkedCount++;
      if (!llms.includes(tool.canonicalUrl)) {
        issues.push({
          code: 'LLMS_MISSING_TOOL',
          severity: 'critical',
          target: tool.canonicalUrl,
          message: `Live tool ${tool.canonicalUrl} is missing from llms.txt.`,
        });
      }
    }

    const llmsFullPath = path.join(path.dirname(llmsPath), 'llms-full.txt');
    checkedCount++;
    if (fileExists(llmsFullPath)) {
      const llmsFull = readTextFile(llmsFullPath);
      for (const tool of liveTools) {
        checkedCount++;
        if (!llmsFull.includes(tool.canonicalUrl)) {
          issues.push({
            code: 'LLMS_FULL_MISSING_TOOL',
            severity: 'critical',
            target: llmsFullPath,
            message: `Live tool ${tool.canonicalUrl} is missing from llms-full.txt.`,
          });
        }
      }
    }
  }

  return createValidationReport('robots:llms', checkedCount, issues);
}

const isDirectExecution =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  const strict = process.argv.includes('--strict');
  const report = await runRobotsAndLlmsValidation();
  assertReportPassed(report, strict);
}
