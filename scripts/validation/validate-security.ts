/**
 * Security and Privacy Policy validator for AHADEX Tools (Phase 9).
 *
 * Enforces:
 *   - Zero dynamic code execution (`eval`, `new Function`, `document.write`)
 *   - Zero arbitrary DOM injection (`dangerouslySetInnerHTML` only permitted for JSON-LD scripts)
 *   - Zero outbound network requests (`fetch`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`) inside `src/tools/`
 *   - File-policy enforcement inside every live tool widget (`Tool.tsx`)
 *   - Zero leaked API keys, private keys, or localhost URLs in prerendered `dist/` HTML
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ValidationIssue, ValidationReport } from '../../src/types/tool';
import { fileExists, readTextFile, resolveFromRoot } from '../utils/file-utils';
import { discoverPublishedRoutes } from '../utils/route-discovery';
import { assertReportPassed, createValidationReport } from '../utils/validation-utils';
import { routeToDistHtmlPath } from './validate-routes';

function collectFilesRecursive(dir: string, exts: readonly string[]): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'tests' || entry.name === '__tests__' || entry.name === 'node_modules') {
        continue;
      }
      results.push(...collectFilesRecursive(full, exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }

  return results;
}

export function inspectSourceSecurity(
  filePath: string,
  content: string,
  isInsideToolsDir: boolean,
  issues: ValidationIssue[],
): void {
  const target = path.relative(process.cwd(), filePath);

  if (/\beval\s*\(|new\s+Function\s*\(|document\.write\s*\(/.test(content)) {
    issues.push({
      code: 'SEC_DYNAMIC_CODE_EXECUTION',
      severity: 'critical',
      target,
      message: 'Unsafe dynamic execution primitive (eval / new Function / document.write) found.',
    });
  }

  if (/\.(?:innerHTML|outerHTML)\s*=/.test(content)) {
    issues.push({
      code: 'SEC_RAW_DOM_ASSIGNMENT',
      severity: 'critical',
      target,
      message: 'Direct innerHTML/outerHTML assignment is forbidden.',
    });
  }

  if (content.includes('dangerouslySetInnerHTML')) {
    const isJsonLdOnly =
      /<script[^>]*type=["']application\/ld\+json["'][^>]*dangerouslySetInnerHTML=\{\{\s*__html:\s*JSON\.stringify\(/s.test(
        content,
      );
    if (!isJsonLdOnly) {
      issues.push({
        code: 'SEC_DANGEROUS_HTML_INJECTION',
        severity: 'critical',
        target,
        message:
          'dangerouslySetInnerHTML is only permitted for serialized application/ld+json structured data.',
      });
    }
  }

  if (isInsideToolsDir) {
    if (
      /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*(?:\(|new\b)|\bnavigator\.sendBeacon\b/.test(
        content,
      )
    ) {
      issues.push({
        code: 'SEC_TOOL_OUTBOUND_NETWORK',
        severity: 'critical',
        target,
        message:
          'Tool module contains outbound network APIs, violating AHADEX strict local-only processing policy.',
      });
    }
  }

  if (
    /AIza[0-9A-Za-z_-]{20,}|sk_live_[0-9A-Za-z]{16,}|-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(
      content,
    )
  ) {
    issues.push({
      code: 'SEC_SECRET_PATTERN_DETECTED',
      severity: 'critical',
      target,
      message: 'Potential hardcoded API key or private key detected in source code.',
    });
  }
}

export async function runSecurityValidation(
  options: {
    srcDir?: string;
    distDir?: string;
    toolsRoot?: string;
  } = {},
): Promise<ValidationReport> {
  const srcDir = options.srcDir ?? resolveFromRoot('src');
  const distDir = options.distDir ?? resolveFromRoot('dist');
  const toolsRoot = options.toolsRoot ?? resolveFromRoot('src', 'tools');
  const issues: ValidationIssue[] = [];
  let checkedCount = 0;

  const sourceFiles = collectFilesRecursive(srcDir, ['.ts', '.tsx']);
  for (const filePath of sourceFiles) {
    checkedCount++;
    const content = readTextFile(filePath);
    const inTools = path.resolve(filePath).startsWith(path.resolve(toolsRoot));
    inspectSourceSecurity(filePath, content, inTools, issues);
  }

  // Verify every live tool UI enforces shared file-policy validation.
  const routes = await discoverPublishedRoutes(toolsRoot);
  for (const route of routes) {
    if (route.kind !== 'tool') continue;
    checkedCount++;
    const toolTsx = path.join(toolsRoot, route.slug, 'Tool.tsx');
    if (!fileExists(toolTsx)) {
      issues.push({
        code: 'SEC_TOOL_WIDGET_MISSING',
        severity: 'critical',
        target: `tool:${route.slug}`,
        message: `Missing Tool.tsx for live tool ${route.slug}.`,
      });
      continue;
    }
    const widgetSource = readTextFile(toolTsx);
    if (!widgetSource.includes('file-policy')) {
      issues.push({
        code: 'SEC_TOOL_NO_FILE_POLICY',
        severity: 'critical',
        target: `tool:${route.slug}`,
        message: `${route.slug}/Tool.tsx does not import shared platform file-policy validation.`,
      });
    }
  }

  // Verify built dist/ HTML has zero localhost or secret leaks.
  if (fileExists(path.join(distDir, 'index.html'))) {
    for (const route of routes) {
      checkedCount++;
      const htmlPath = routeToDistHtmlPath(route.path, distDir);
      if (!fileExists(htmlPath)) continue;
      const html = readTextFile(htmlPath);
      if (/https?:\/\/(?:localhost|127\.0\.0\.1)/i.test(html)) {
        issues.push({
          code: 'SEC_DIST_LOCALHOST_LEAK',
          severity: 'critical',
          target: `dist:${route.path}`,
          message: `Prerendered HTML for ${route.path} exposes a localhost URL.`,
        });
      }
      if (/AIza[0-9A-Za-z_-]{20,}|sk_live_[0-9A-Za-z]{16,}/.test(html)) {
        issues.push({
          code: 'SEC_DIST_SECRET_LEAK',
          severity: 'critical',
          target: `dist:${route.path}`,
          message: `Prerendered HTML for ${route.path} contains a credential-like token.`,
        });
      }
    }
  }

  return createValidationReport('security:static-audit', checkedCount, issues);
}

const isDirectExecution =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  const strict = process.argv.includes('--strict');
  const report = await runSecurityValidation();
  assertReportPassed(report, strict);
}
