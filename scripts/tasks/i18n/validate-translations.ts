/**
 * Translation validator. Ensures user-facing strings are not hardcoded
 * in components when they should be translatable.
 *
 * Currently, we detect hardcoded English strings in critical UI files.
 * When i18n infrastructure is added, this validator will check that
 * strings go through a t() function.
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { info, warning, type Violation } from '../../utils/validation-result';

function lineNumberAt(source: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

/** Files where hardcoded strings are OK (config, content, SEO). */
const ALLOWED_HARDCODED = [
  'src/config/',
  'src/tools/',
  'src/pages/',
  'src/platform/seo/',
  'src/platform/observability/',
];

function isAllowed(relPath: string): boolean {
  return ALLOWED_HARDCODED.some((prefix) => relPath.startsWith(prefix));
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const files = await walkFiles(PATHS.src, { extensions: ['.tsx'] });

  for (const file of files) {
    const relPath = file.substring(PATHS.root.length + 1).split('\\').join('/');
    if (relPath.endsWith('.test.tsx')) continue;
    if (isAllowed(relPath)) continue;

    const src = await readText(file);

    // Look for JSX text content (hardcoded strings between tags).
    // This is a heuristic: only flags short inline strings.
    const textRe = />(\s*[A-Z][a-z][^<>{}]{2,40})\s*</g;
    let m: RegExpExecArray | null;
    while ((m = textRe.exec(src)) !== null) {
      const text = m[1].trim();
      if (text.length < 5) continue;
      violations.push(
        warning(
          'hardcoded-string',
          `Possibly hardcoded UI string: "${text.slice(0, 40)}".`,
          {
            file: relPath,
            line: lineNumberAt(src, m.index),
            hint: 'Extract to translation map when i18n is added.',
          },
        ),
      );
      if (m.index === textRe.lastIndex) textRe.lastIndex += 1;
    }
  }

  if (violations.length === 0) {
    violations.push(
      info(
        'translations-ok',
        'No hardcoded UI strings detected outside allowed paths.',
      ),
    );
  }

  return violations;
}
