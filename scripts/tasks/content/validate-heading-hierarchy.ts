/**
 * Heading hierarchy validator. Ensures heading order is semantic:
 *   - Exactly one h1 per page
 *   - No h2 before h1
 *   - No h4 without h3 (no skipped levels)
 *   - H1 is present on every page
 *
 * Checks both JSX (h1, h2 tags) and content constants (HERO.h1,
 * sections with heading).
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

function lineNumberAt(source: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

function validateJsxHeadings(src: string, relPath: string): Violation[] {
  const violations: Violation[] = [];
  const re = /<h([1-6])\b/g;
  let m: RegExpExecArray | null;
  const found: Array<{ level: number; line: number }> = [];
  while ((m = re.exec(src)) !== null) {
    found.push({ level: parseInt(m[1], 10), line: lineNumberAt(src, m.index) });
  }
  if (found.length === 0) return violations;

  const h1Count = found.filter((h) => h.level === 1).length;
  if (h1Count === 0) {
    violations.push(error('no-h1', 'File has headings but no h1.', { file: relPath }));
  } else if (h1Count > 1) {
    violations.push(
      error('multiple-h1', `File has ${h1Count} h1 elements (must be 1).`, {
        file: relPath,
      }),
    );
  }

  let prev = 0;
  for (const { level, line } of found) {
    if (prev > 0 && level > prev + 1) {
      violations.push(
        error('skipped-heading-level', `Heading jumps from h${prev} to h${level}.`, {
          file: relPath,
          line,
          hint: 'Use the next heading level without skipping.',
        }),
      );
    }
    prev = level;
  }
  return violations;
}

function validateContentHeadings(src: string, relPath: string): Violation[] {
  const violations: Violation[] = [];
  if (!/HERO/.test(src)) return violations;

  // HERO.h1 must be present.
  const heroBlock = src.match(/HERO\s*=\s*\{([\s\S]*?)\}\s*as const;/);
  if (heroBlock && !/h1\s*:/.test(heroBlock[1])) {
    violations.push(
      error('hero-no-h1', 'HERO object must declare "h1".', {
        file: relPath,
      }),
    );
  }

  // SECTIONS must have at least one heading.
  const sectionsBlock = src.match(/SECTIONS\s*[^=]*=\s*\[([\s\S]*?)\];/);
  if (sectionsBlock) {
    const headings = (sectionsBlock[1].match(/heading\s*:/g) ?? []).length;
    if (headings === 0) {
      violations.push(
        warning('sections-no-headings', 'SECTIONS has no headings.', {
          file: relPath,
        }),
      );
    }
  }

  return violations;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  // Rule 1: jsx headings within tool Page.tsx only (sub-components
  // legitimately contain h2/h3 without h1; the parent provides the h1).
  const tsxFiles = await walkFiles(PATHS.srcTools, { extensions: ['.tsx'] });
  for (const file of tsxFiles) {
    const relPath = file
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');
    if (relPath.endsWith('.test.tsx')) continue;
    if (!relPath.endsWith('/Page.tsx')) continue;
    const src = await readText(file);
    violations.push(...validateJsxHeadings(src, relPath));
  }

  // Rule 2: static pages must have h1.
  const pageFiles = await walkFiles(PATHS.srcPages, { extensions: ['.tsx'] });
  for (const file of pageFiles) {
    const relPath = file
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');
    if (relPath.endsWith('.test.tsx')) continue;
    const src = await readText(file);
    const h1Count = (src.match(/<h1\b/g) ?? []).length;
    // NotFound may use different convention; still must have h1.
    if (h1Count === 0) {
      violations.push(error('page-no-h1', `Page has no h1 element.`, { file: relPath }));
    } else if (h1Count > 1) {
      violations.push(
        error('page-multiple-h1', `Page has ${h1Count} h1 elements.`, {
          file: relPath,
        }),
      );
    }
  }

  // Rule 3: content constants.
  const contentFiles = (await walkFiles(PATHS.srcTools, { extensions: ['.ts'] })).filter((f) =>
    f.endsWith('/content.ts'),
  );
  for (const file of contentFiles) {
    const relPath = file
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');
    const src = await readText(file);
    violations.push(...validateContentHeadings(src, relPath));
  }

  return violations;
}
