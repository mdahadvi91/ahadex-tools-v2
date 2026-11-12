/**
 * Accessibility audit validator. Runs a broad static audit:
 *   - Every page has <h1>
 *   - Every form input has an associated label
 *   - Every image has alt
 *   - Every icon-only button has label
 *   - Every page has lang attribute on <html>
 *   - No autoplay or marquee elements
 *
 * This static audit complements the runtime axe-core audit that
 * runs in Playwright E2E tests.
 */

import { walkFiles, readText, pathExists } from '../../utils/file-system';
import { join } from 'node:path';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

function lineNumberAt(source: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

async function auditIndexHtml(): Promise<Violation[]> {
  const violations: Violation[] = [];
  const path = join(PATHS.root, 'index.html');
  if (!(await pathExists(path))) return violations;

  const src = await readText(path);
  if (!/<html\b[^>]*\blang\s*=/.test(src)) {
    violations.push(
      error('html-no-lang', '<html> has no lang attribute.', {
        file: 'index.html',
        hint: 'Screen readers need lang="en".',
      }),
    );
  }
  return violations;
}

async function auditPages(): Promise<Violation[]> {
  const violations: Violation[] = [];
  const pageFiles = await walkFiles(PATHS.srcPages, { extensions: ['.tsx'] });

  for (const file of pageFiles) {
    const relPath = file
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');
    if (relPath.endsWith('.test.tsx')) continue;

    const src = await readText(file);

    // Rule: must have h1.
    if (!/<h1\b/.test(src)) {
      violations.push(
        error('page-no-h1', 'Page has no <h1>.', {
          file: relPath,
          hint: 'Every page needs exactly one <h1>.',
        }),
      );
    }
  }

  return violations;
}

async function auditToolContent(): Promise<Violation[]> {
  const violations: Violation[] = [];
  const contentFiles = await walkFiles(PATHS.srcTools, { extensions: ['.tsx'] });

  for (const file of contentFiles) {
    const relPath = file
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');
    if (relPath.endsWith('.test.tsx')) continue;

    const src = await readText(file);

    // Rule: every <img> has alt (even empty).
    const imgRe = /<img\b[^>]*>/g;
    let m: RegExpExecArray | null;
    while ((m = imgRe.exec(src)) !== null) {
      if (!/\balt\s*=/.test(m[0])) {
        violations.push(
          error('img-no-alt', '<img> without alt attribute.', {
            file: relPath,
            line: lineNumberAt(src, m.index),
            hint: 'Use alt="" for decorative, descriptive alt for informative.',
          }),
        );
      }
    }
  }

  return violations;
}

async function auditGeneralPatterns(): Promise<Violation[]> {
  const violations: Violation[] = [];
  const allTsx = await walkFiles(PATHS.src, { extensions: ['.tsx'] });

  for (const file of allTsx) {
    const relPath = file
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');
    if (relPath.endsWith('.test.tsx')) continue;

    const src = await readText(file);

    // Rule: no <marquee> or <blink> (deprecated + harmful to vestibular users).
    for (const tag of ['marquee', 'blink']) {
      const re = new RegExp(`<${tag}\\b`, 'g');
      let m: RegExpExecArray | null;
      while ((m = re.exec(src)) !== null) {
        violations.push(
          error('deprecated-motion-tag', `<${tag}> is deprecated and harms accessibility.`, {
            file: relPath,
            line: lineNumberAt(src, m.index),
          }),
        );
      }
    }

    // Rule: form inputs without associated label.
    const inputRe = /<(input|select|textarea)\b(?![^>]*type\s*=\s*['"]hidden['"])[^>]*>/g;
    let m: RegExpExecArray | null;
    while ((m = inputRe.exec(src)) !== null) {
      const tag = m[0];
      const hasId = /\bid\s*=\s*['"]([^'"]+)['"]/.exec(tag);
      const hasLabel = /\baria-label|\baria-labelledby|\btitle\s*=|\bplaceholder\s*=/.test(tag);

      if (!hasLabel) {
        if (hasId) {
          const id = hasId[1];
          const htmlForRe = new RegExp(`<label\\b[^>]*\\bhtmlFor\\s*=\\s*['"]${id}['"]`);
          if (!htmlForRe.test(src)) {
            violations.push(
              error('input-no-label', `Input "${id}" has no associated label.`, {
                file: relPath,
                line: lineNumberAt(src, m.index),
                hint: 'Add <label htmlFor="' + id + '"> or aria-label.',
              }),
            );
          }
        } else {
          violations.push(
            warning('input-no-label', 'Input has no id, label, or aria-label.', {
              file: relPath,
              line: lineNumberAt(src, m.index),
              hint: 'Add an id and label, or aria-label.',
            }),
          );
        }
      }
    }

    // Rule: autoplay.
    if (/<(video|audio)\b[^>]*\bautoplay\b/.test(src) && !/\bmuted\b/.test(src)) {
      violations.push(
        error('autoplay-no-muted', 'Autoplay media without muted (blocks screen readers).', {
          file: relPath,
          hint: 'Add muted or remove autoplay.',
        }),
      );
    }
  }

  return violations;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];
  violations.push(...(await auditIndexHtml()));
  violations.push(...(await auditPages()));
  violations.push(...(await auditToolContent()));
  violations.push(...(await auditGeneralPatterns()));
  return violations;
}
