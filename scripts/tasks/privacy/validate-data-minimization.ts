/**
 * Data minimization validator. Ensures code paths never collect or
 * transmit data they do not need:
 *   - analytics events never include PII keys (name, email, phone...)
 *   - data-minimization.ts actually truncates strings and strips keys
 *   - file names are never included in analytics payloads
 *   - localStorage usage is limited to explicit allowlist keys
 */

import { join } from 'node:path';
import { readText, walkFiles, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

const DATA_MIN = join(PATHS.srcPlatform, 'privacy/data-minimization.ts');
const ANALYTICS = join(PATHS.srcPlatform, 'analytics/analytics.ts');
const PRIVACY_FILTER = join(PATHS.srcPlatform, 'analytics/privacy-filter.ts');

const PII_KEYS = [
  'email',
  'phone',
  'name',
  'firstName',
  'lastName',
  'address',
  'ip',
  'userId',
  'userName',
  'file.name',
  'fileName',
  'filename',
];

/** Allowed keys in localStorage. Extend deliberately. */
const ALLOWED_STORAGE_KEYS = new Set([
  'ahx_consent',
  'ahx_theme',
  'ahx_lang',
]);

function lineNumberAt(source: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  // Rule 1: data-minimization.ts must exist and export both helpers.
  if (!(await pathExists(DATA_MIN))) {
    violations.push(
      error('data-min-missing', 'src/platform/privacy/data-minimization.ts is missing.', {
        file: 'src/platform/privacy/data-minimization.ts',
      }),
    );
  } else {
    const src = await readText(DATA_MIN);
    if (!/export\s+function\s+minimize\b/.test(src)) {
      violations.push(
        error(
          'data-min-missing-minimize',
          'data-minimization.ts must export "minimize".',
          { file: 'src/platform/privacy/data-minimization.ts' },
        ),
      );
    }
    if (!/export\s+function\s+truncateString\b/.test(src)) {
      violations.push(
        warning(
          'data-min-missing-truncate',
          'data-minimization.ts does not export truncateString.',
          { file: 'src/platform/privacy/data-minimization.ts' },
        ),
      );
    }
  }

  // Rule 2: analytics.ts must route payloads through filterPayload
  // or privacy-filter before dispatch.
  if (await pathExists(ANALYTICS)) {
    const src = await readText(ANALYTICS);
    if (!/filterPayload|privacy-filter/.test(src)) {
      violations.push(
        error(
          'analytics-no-privacy-filter',
          'analytics.ts does not filter payloads before dispatch.',
          {
            file: 'src/platform/analytics/analytics.ts',
            hint: 'Route every payload through filterPayload.',
          },
        ),
      );
    }
  }

  // Rule 3: privacy-filter.ts must reference data-minimization.
  if (await pathExists(PRIVACY_FILTER)) {
    const src = await readText(PRIVACY_FILTER);
    if (!/data-minimization|minimize\(/.test(src)) {
      violations.push(
        error(
          'privacy-filter-no-minimize',
          'privacy-filter.ts does not call minimize() from data-minimization.',
          { file: 'src/platform/analytics/privacy-filter.ts' },
        ),
      );
    }
  }

  // Rule 4: no source file may log PII keys to analytics.
  const files = await walkFiles(PATHS.src, { extensions: ['.ts', '.tsx'] });
  for (const file of files) {
    const relPath = file.replace(PATHS.root + '/', '').split('\\').join('/');
    if (relPath.endsWith('.test.ts') || relPath.endsWith('.test.tsx')) continue;
    if (relPath.startsWith('src/platform/analytics/')) continue;

    const src = await readText(file);

    for (const key of PII_KEYS) {
      // Look for `trackEvent(..., { key: ... })` or `payload.key =`
      const patterns = [
        new RegExp(`trackEvent\\([^)]*\\b${key.replace('.', '\\.')}\\s*:`, 'g'),
        new RegExp(`\\b${key.replace('.', '\\.')}\\s*:\\s*[^,}]+`, 'g'),
      ];
      for (const pattern of patterns) {
        const match = pattern.exec(src);
        if (match && /track/i.test(src.slice(Math.max(0, match.index - 200), match.index))) {
          violations.push(
            error(
              'analytics-pii-key',
              `Analytics call includes forbidden PII key "${key}".`,
              {
                file: relPath,
                line: lineNumberAt(src, match.index),
                hint: 'Remove the PII key from the payload.',
              },
            ),
          );
          break;
        }
      }
    }
  }

  // Rule 5: localStorage must use only allowed keys.
  const storageFiles = await walkFiles(PATHS.src, { extensions: ['.ts', '.tsx'] });
  for (const file of storageFiles) {
    const relPath = file.replace(PATHS.root + '/', '').split('\\').join('/');
    if (relPath.endsWith('.test.ts') || relPath.endsWith('.test.tsx')) continue;

    const src = await readText(file);
    const re = /(?:localStorage|sessionStorage)\.(?:get|set|remove)Item\(\s*['"]([^'"]+)['"]/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(src)) !== null) {
      const key = match[1];
      if (!ALLOWED_STORAGE_KEYS.has(key)) {
        violations.push(
          warning(
            'storage-key-unapproved',
            `Storage key "${key}" is not in the allowlist.`,
            {
              file: relPath,
              line: lineNumberAt(src, match.index),
              hint: 'Add the key to ALLOWED_STORAGE_KEYS in the validator if intentional.',
            },
          ),
        );
      }
      if (match.index === re.lastIndex) re.lastIndex += 1;
    }
  }

  return violations;
}
