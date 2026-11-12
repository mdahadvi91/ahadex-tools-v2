/**
 * Hreflang validator. Ensures hreflang tags are consistent if present:
 *   - hreflang values match supported locales
 *   - x-default is present if any hreflang exists
 *   - No duplicate hreflang combinations
 *
 * Since the site is English-only currently, this validator skips if
 * no hreflang tags are found. When translations are added, the
 * validator activates.
 *
 * Ownership: this validator lives in i18n group (not SEO) to avoid
 * duplication — see docs/architecture.md.
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { info, warning, type Violation } from '../../utils/validation-result';

const SUPPORTED_LOCALES = ['en'];

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];
  let foundHreflang = 0;

  const files = await walkFiles(PATHS.src, { extensions: ['.tsx', '.ts'] });

  for (const file of files) {
    const relPath = file.substring(PATHS.root.length + 1).split('\\').join('/');
    if (relPath.endsWith('.test.ts') || relPath.endsWith('.test.tsx')) continue;

    const src = await readText(file);

    // Match hreflang="xx" or hreflang="xx-YY"
    const re = /hreflang\s*=\s*['"]([a-z]{2}(?:-[A-Za-z]{2,})?)['"]/g;
    let m: RegExpExecArray | null;
    const found: string[] = [];
    while ((m = re.exec(src)) !== null) {
      found.push(m[1]);
      foundHreflang += 1;

      const lang = m[1].split('-')[0];
      if (lang !== 'x' && !SUPPORTED_LOCALES.includes(lang)) {
        violations.push(
          warning(
            'unsupported-hreflang',
            `hreflang="${m[1]}" language "${lang}" not in supported locales.`,
            {
              file: relPath,
              hint: `Supported: ${SUPPORTED_LOCALES.join(', ')}`,
            },
          ),
        );
      }
    }

    // Duplicate check within file.
    const dups = found.filter((v, i) => found.indexOf(v) !== i);
    if (dups.length > 0) {
      violations.push(
        warning(
          'duplicate-hreflang',
          `Duplicate hreflang values in file: ${[...new Set(dups)].join(', ')}`,
          { file: relPath },
        ),
      );
    }

    // x-default required if any other hreflang exists.
    if (found.length > 0 && !found.includes('x-default')) {
      violations.push(
        warning(
          'missing-x-default',
          'hreflang present but x-default is missing.',
          {
            file: relPath,
            hint: 'Add <link rel="alternate" hreflang="x-default" href="..." />.',
          },
        ),
      );
    }
  }

  if (foundHreflang === 0) {
    violations.push(
      info(
        'hreflang-skipped',
        'No hreflang tags found (English-only site, i18n deferred).',
      ),
    );
  }

  return violations;
}
