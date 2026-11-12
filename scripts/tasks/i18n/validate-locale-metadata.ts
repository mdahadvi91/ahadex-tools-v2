/**
 * Locale metadata validator. Ensures locale-specific metadata is
 * consistent:
 *   - OG locale format is "language_TERRITORY" (e.g. "en_US")
 *   - No conflicting locale declarations in metadata
 *   - If multiple locales are added later, each must have distinct metadata
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, info, warning, type Violation } from '../../utils/validation-result';

/** OG locale format: 2-letter language + underscore + 2-letter territory. */
const OG_LOCALE_RE = /^[a-z]{2}_[A-Z]{2}$/;

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const files = await walkFiles(PATHS.src, { extensions: ['.ts', '.tsx'] });

  for (const file of files) {
    const relPath = file
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');
    if (relPath.endsWith('.test.ts') || relPath.endsWith('.test.tsx')) continue;

    const src = await readText(file);

    // Check ogLocale values.
    const ogLocaleRe = /ogLocale\s*:\s*['"]([^'"]+)['"]/g;
    let m: RegExpExecArray | null;
    while ((m = ogLocaleRe.exec(src)) !== null) {
      const locale = m[1];
      if (!OG_LOCALE_RE.test(locale)) {
        violations.push(
          error('invalid-og-locale', `ogLocale "${locale}" must match format "en_US".`, {
            file: relPath,
          }),
        );
      }
    }

    // Check for conflicting locale declarations.
    const localeMatches = src.match(/locale\s*:\s*['"]([^'"]+)['"]/g) ?? [];
    if (localeMatches.length > 1) {
      const values = new Set(localeMatches.map((x) => x.split(/['"]/)[1]));
      if (values.size > 1) {
        violations.push(
          warning(
            'conflicting-locales',
            `Multiple locale declarations in file: ${[...values].join(', ')}.`,
            { file: relPath },
          ),
        );
      }
    }
  }

  // Verify site.ts has a locale set.
  const sitePath = `${PATHS.srcConfig}/site.ts`;
  if (await walkFiles(PATHS.srcConfig, { extensions: ['.ts'] }).then((f) => f.includes(sitePath))) {
    const src = await readText(sitePath);
    if (!/locale\s*:/.test(src)) {
      violations.push(
        warning('site-missing-locale', 'src/config/site.ts does not declare a locale.', {
          file: 'src/config/site.ts',
        }),
      );
    }
  }

  if (violations.length === 0) {
    violations.push(info('locale-metadata-ok', 'Locale metadata consistent (single-locale site).'));
  }

  return violations;
}
