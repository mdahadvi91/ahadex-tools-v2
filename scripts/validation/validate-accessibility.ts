/**
 * Accessibility validator for AHADEX Tools (Phase 9).
 *
 * Audits prerendered static HTML files across all published routes plus source
 * UI form controls for WCAG structural essentials:
 *   - `<html lang="...">` declaration
 *   - Skip-to-content link targeting `#main-content`
 *   - `<header>`, `<nav>`, `<main id="main-content">`, and `<footer>` landmarks
 *   - Sequential heading hierarchy (exactly one `<h1>`, zero skipped levels)
 *   - `alt` attributes on every `<img>`
 *   - Accessible names on buttons and rendered form inputs/selects
 *   - Safe external link attributes (`target="_blank"` paired with `rel="noopener"`)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ValidationIssue, ValidationReport } from '../../src/types/tool';
import { fileExists, readTextFile, resolveFromRoot } from '../utils/file-utils';
import { discoverPublishedRoutes } from '../utils/route-discovery';
import { assertReportPassed, createValidationReport } from '../utils/validation-utils';
import { routeToDistHtmlPath } from './validate-routes';

function stripTags(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function inspectHtmlAccessibility(
  html: string,
  target: string,
  issues: ValidationIssue[],
): void {
  if (!/<html[^>]*\blang=["'][a-z]{2,}["']/i.test(html)) {
    issues.push({
      code: 'A11Y_MISSING_HTML_LANG',
      severity: 'critical',
      target,
      message: 'Document is missing a valid <html lang="..."> attribute.',
    });
  }

  if (!/<a\s+[^>]*href=["']#main-content["']/i.test(html)) {
    issues.push({
      code: 'A11Y_MISSING_SKIP_LINK',
      severity: 'warning',
      target,
      message: 'Document is missing a skip-to-content link targeting #main-content.',
    });
  }

  if (!/<main\s+[^>]*id=["']main-content["']/i.test(html)) {
    issues.push({
      code: 'A11Y_MISSING_MAIN_LANDMARK',
      severity: 'critical',
      target,
      message: 'Document must contain a <main id="main-content"> landmark.',
    });
  }

  if (!/<header[\s>]/i.test(html) || !/<nav[\s>]/i.test(html) || !/<footer[\s>]/i.test(html)) {
    issues.push({
      code: 'A11Y_MISSING_PAGE_LANDMARKS',
      severity: 'critical',
      target,
      message: 'Document must expose <header>, <nav>, and <footer> landmarks.',
    });
  }

  // Heading hierarchy validation.
  const headingMatches = Array.from(html.matchAll(/<h([1-6])(?:\s[^>]*)?>/gi)).map((m) =>
    Number(m[1]),
  );
  const h1Count = headingMatches.filter((level) => level === 1).length;

  if (h1Count !== 1) {
    issues.push({
      code: 'A11Y_H1_COUNT_INVALID',
      severity: 'critical',
      target,
      message: `Document must contain exactly one <h1> heading (found ${h1Count}).`,
    });
  }

  for (let i = 1; i < headingMatches.length; i++) {
    const prev = headingMatches[i - 1];
    const curr = headingMatches[i];
    if (curr > prev + 1) {
      issues.push({
        code: 'A11Y_HEADING_LEVEL_SKIPPED',
        severity: 'warning',
        target,
        message: `Heading level skipped from <h${prev}> to <h${curr}>.`,
      });
    }
  }

  // Every <img> must carry an alt attribute.
  for (const imgMatch of html.matchAll(/<img\b([^>]*)>/gi)) {
    const attrs = imgMatch[1] ?? '';
    if (!/\balt\s*=/i.test(attrs)) {
      issues.push({
        code: 'A11Y_IMG_MISSING_ALT',
        severity: 'critical',
        target,
        message: `Image element is missing an alt attribute: <img${attrs.slice(0, 80)}>`,
      });
    }
  }

  // Every <button> must have visible text or aria-label / aria-labelledby.
  for (const btnMatch of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
    const attrs = btnMatch[1] ?? '';
    const innerText = stripTags(btnMatch[2] ?? '');
    const hasAria = /\baria-(?:label|labelledby)\s*=\s*["'][^"']+["']/i.test(attrs);
    if (!hasAria && innerText.length === 0) {
      issues.push({
        code: 'A11Y_EMPTY_BUTTON',
        severity: 'critical',
        target,
        message: 'Button lacks both visible text and an aria-label attribute.',
      });
    }
  }

  // Every rendered form field must have a label association or aria-label.
  const labelForIds = new Set<string>();
  for (const labelMatch of html.matchAll(/<label\b[^>]*\bfor=["']([^"']+)["'][^>]*>/gi)) {
    labelForIds.add(labelMatch[1] ?? '');
  }

  for (const fieldMatch of html.matchAll(/<(input|select|textarea)\b([^>]*)>/gi)) {
    const tag = (fieldMatch[1] ?? '').toLowerCase();
    const attrs = fieldMatch[2] ?? '';
    if (tag === 'input' && /\btype=["'](?:hidden|submit|button|reset)["']/i.test(attrs)) {
      continue;
    }

    const hasAria = /\baria-(?:label|labelledby)\s*=\s*["'][^"']+["']/i.test(attrs);
    const idMatch = attrs.match(/\bid=["']([^"']+)["']/i);
    const hasAssociatedLabel = Boolean(idMatch?.[1] && labelForIds.has(idMatch[1]));

    if (!hasAria && !hasAssociatedLabel) {
      issues.push({
        code: 'A11Y_UNLABELED_CONTROL',
        severity: 'critical',
        target,
        message: `Rendered <${tag}> lacks an associated <label for="..."> or aria-label.`,
      });
    }
  }

  // External target="_blank" links should include rel="noopener".
  for (const linkMatch of html.matchAll(/<a\b([^>]*\btarget=["']_blank["'][^>]*)>/gi)) {
    const attrs = linkMatch[1] ?? '';
    if (!/\brel=["'][^"']*\bnoopener\b[^"']*["']/i.test(attrs)) {
      issues.push({
        code: 'A11Y_TARGET_BLANK_NO_REL',
        severity: 'warning',
        target,
        message: 'External link with target="_blank" is missing rel="noopener".',
      });
    }
  }
}

export function inspectToolInteractiveLabels(toolsRoot: string, issues: ValidationIssue[]): number {
  let scanned = 0;
  if (!fs.existsSync(toolsRoot)) return 0;

  for (const entry of fs.readdirSync(toolsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const toolTsx = path.join(toolsRoot, entry.name, 'Tool.tsx');
    if (!fileExists(toolTsx)) continue;

    scanned++;
    const source = readTextFile(toolTsx);
    const labelForCount = (source.match(/\bhtmlFor=/g) ?? []).length;
    const inlineWrappedCheckboxes = (source.match(/<label[^>]*>\s*<input/g) ?? []).length;
    const selectCount = (source.match(/<select\b/g) ?? []).length;

    if (selectCount > 0 && labelForCount === 0 && inlineWrappedCheckboxes === 0) {
      issues.push({
        code: 'A11Y_TOOL_MISSING_HTMLFOR',
        severity: 'warning',
        target: `tool:${entry.name}`,
        message:
          'Tool.tsx renders <select> controls without explicit htmlFor/id label associations.',
      });
    }
  }

  return scanned;
}

export async function runAccessibilityValidation(
  options: {
    distDir?: string;
    toolsRoot?: string;
  } = {},
): Promise<ValidationReport> {
  const distDir = options.distDir ?? resolveFromRoot('dist');
  const toolsRoot = options.toolsRoot ?? resolveFromRoot('src', 'tools');
  const issues: ValidationIssue[] = [];
  const routes = await discoverPublishedRoutes(toolsRoot);
  let checkedCount = 0;

  for (const route of routes) {
    checkedCount++;
    const htmlPath = routeToDistHtmlPath(route.path, distDir);
    if (!fileExists(htmlPath)) {
      issues.push({
        code: 'A11Y_DIST_HTML_MISSING',
        severity: 'critical',
        target: `a11y:${route.path}`,
        message: `Missing prerendered HTML at ${htmlPath}. Run "npm run build:ssg" first.`,
      });
      continue;
    }

    const html = readTextFile(htmlPath);
    inspectHtmlAccessibility(html, `a11y:${route.path}`, issues);
  }

  checkedCount += inspectToolInteractiveLabels(toolsRoot, issues);

  return createValidationReport('accessibility:wcag-audit', checkedCount, issues);
}

const isDirectExecution =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  const strict = process.argv.includes('--strict');
  const report = await runAccessibilityValidation();
  assertReportPassed(report, strict);
}
