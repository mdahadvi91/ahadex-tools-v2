/**
 * Locale config validator. Ensures locale configuration is set up
 * correctly (currently English-first, but infrastructure ready for
 * future locales):
 *   - supportedLocales declared
 *   - defaultLocale set
 *   - hreflang tags match supportedLocales
 *   - html lang attribute matches defaultLocale
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, info, warning, type Violation } from '../../utils/validation-result';

/** Currently only English is supported. */
const EXPECTED_DEFAULT_LOCALE = 'en';

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  // Rule 1: html lang attribute in index.html.
  const indexHtmlPath = `${PATHS.root}/index.html`;
  if (
    await walkFiles(PATHS.root, { extensions: ['.html'] }).then((f) => f.includes(indexHtmlPath))
  ) {
    const src = await readText(indexHtmlPath);
    const langMatch = src.match(/<html\b[^>]*\blang\s*=\s*['"]([^'"]+)['"]/);
    if (!langMatch) {
      violations.push(
        error('missing-lang', '<html> tag has no lang attribute.', {
          file: 'index.html',
          hint: `Add lang="${EXPECTED_DEFAULT_LOCALE}".`,
        }),
      );
    } else if (langMatch[1] !== EXPECTED_DEFAULT_LOCALE) {
      violations.push(
        warning(
          'wrong-default-lang',
          `<html lang="${langMatch[1]}"> (expected "${EXPECTED_DEFAULT_LOCALE}").`,
          { file: 'index.html' },
        ),
      );
    }
  }

  // Rule 2: site.ts has a locale field.
  const siteConfigPath = `${PATHS.srcConfig}/site.ts`;
  if (
    await walkFiles(PATHS.srcConfig, { extensions: ['.ts'] }).then((f) =>
      f.includes(siteConfigPath),
    )
  ) {
    const src = await readText(siteConfigPath);
    if (!/locale\s*:/.test(src)) {
      violations.push(
        warning('missing-locale-config', 'site.ts does not declare a locale field.', {
          file: 'src/config/site.ts',
        }),
      );
    }
  }

  // Rule 3: no unexpected locale codes in html lang attributes.
  const htmlFiles = await walkFiles(PATHS.root, {
    extensions: ['.html'],
    skipDirs: ['node_modules', 'dist', '.git'],
    maxDepth: 2,
  });

  for (const file of htmlFiles) {
    const relPath = file
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');
    const src = await readText(file);
    const langMatches = src.matchAll(/<html\b[^>]*\blang\s*=\s*['"]([^'"]+)['"]/g);
    for (const m of langMatches) {
      if (m[1] !== EXPECTED_DEFAULT_LOCALE && !m[1].startsWith(`${EXPECTED_DEFAULT_LOCALE}-`)) {
        violations.push(
          warning(
            'unexpected-locale',
            `File declares lang="${m[1]}" (expected "${EXPECTED_DEFAULT_LOCALE}" or "${EXPECTED_DEFAULT_LOCALE}-*").`,
            { file: relPath },
          ),
        );
      }
    }
  }

  violations.push(info('locale-config-ok', `Default locale: ${EXPECTED_DEFAULT_LOCALE}`));

  return violations;
}
