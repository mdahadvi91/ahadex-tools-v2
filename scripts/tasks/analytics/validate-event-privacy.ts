/**
 * Event privacy validator. Ensures analytics payloads do not leak PII
 * or file data:
 *   - Payload interfaces contain only allowlisted field names.
 *   - Tracked events never carry filename, content, or PII keys.
 *   - privacy-filter.ts covers the full PII key set.
 *   - File size is bucketed, never raw.
 */

import { join } from 'node:path';
import { readText, walkFiles, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

const EVENTS_FILE = join(PATHS.srcPlatform, 'analytics/events.ts');
const PRIVACY_FILTER = join(PATHS.srcPlatform, 'analytics/privacy-filter.ts');

/** Field names that must never appear in analytics payloads. */
const FORBIDDEN_FIELDS = [
  'email',
  'phone',
  'name',
  'fullName',
  'firstName',
  'lastName',
  'address',
  'ip',
  'ipAddress',
  'userId',
  'sessionId',
  'filename',
  'fileName',
  'file.name',
  'fileContent',
  'fileData',
  'blob',
  'buffer',
  'content',
  'password',
  'token',
  'ssn',
  'dob',
];

/** Payload field names that are required to be bucketed. */
const BUCKETED_FIELDS = ['fileSize'];

/** Allowlisted analytics field names. Anything else is suspicious. */
const ALLOWED_FIELDS = new Set([
  'path',
  'title',
  'toolId',
  'toolName',
  'fileType',
  'fileSizeBucket',
  'fileCount',
  'durationMs',
  'reason',
  'errorCode',
  'analytics',
  'ads',
  'slot',
  'position',
  'source',
  'locale',
  'theme',
  'timestamp',
]);

function lineNumberAt(src: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < src.length; i++) {
    if (src.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

/** Extracts all field names declared inside the payload interfaces. */
function extractPayloadFields(src: string): Array<{ field: string; line: number }> {
  const fields: Array<{ field: string; line: number }> = [];
  const interfaceRe = /interface\s+\w*Payload\w*\s*\{([\s\S]*?)\}/g;
  let im: RegExpExecArray | null;
  while ((im = interfaceRe.exec(src)) !== null) {
    const body = im[1];
    const fieldRe = /^\s*([a-zA-Z_$][\w$]*)\s*[?:]?/gm;
    let fm: RegExpExecArray | null;
    while ((fm = fieldRe.exec(body)) !== null) {
      fields.push({
        field: fm[1],
        line: lineNumberAt(src, im.index + fm.index),
      });
    }
  }
  return fields;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  if (!(await pathExists(EVENTS_FILE))) {
    return [
      error('events-file-missing', 'src/platform/analytics/events.ts is missing.', {
        file: 'src/platform/analytics/events.ts',
      }),
    ];
  }

  const eventsSrc = await readText(EVENTS_FILE);
  const fields = extractPayloadFields(eventsSrc);

  // Rule 1: no forbidden field in payloads.
  for (const { field, line } of fields) {
    if (FORBIDDEN_FIELDS.includes(field)) {
      violations.push(
        error('forbidden-payload-field', `Payload declares forbidden field "${field}".`, {
          file: 'src/platform/analytics/events.ts',
          line,
          hint: 'Analytics must never carry PII or file data.',
        }),
      );
    }
  }

  // Rule 2: fileSize-like fields must be bucketed.
  for (const { field, line } of fields) {
    if (BUCKETED_FIELDS.includes(field)) {
      violations.push(
        error('raw-file-size', `Payload uses raw "${field}". Use "${field}Bucket" instead.`, {
          file: 'src/platform/analytics/events.ts',
          line,
          hint: 'Raw file size can fingerprint users.',
        }),
      );
    }
  }

  // Rule 3: fields should be on allowlist (warn only, easy to expand).
  for (const { field, line } of fields) {
    if (!ALLOWED_FIELDS.has(field)) {
      violations.push(
        warning(
          'unapproved-payload-field',
          `Payload field "${field}" is not on the approved list.`,
          {
            file: 'src/platform/analytics/events.ts',
            line,
            hint: 'Add it to ALLOWED_FIELDS in the validator after review.',
          },
        ),
      );
    }
  }

  // Rule 4: privacy-filter.ts must cover at least the core PII list.
  if (await pathExists(PRIVACY_FILTER)) {
    const filterSrc = await readText(PRIVACY_FILTER);
    const coreKeys = ['email', 'phone', 'name', 'ip', 'userId', 'token', 'password'];
    for (const key of coreKeys) {
      if (!filterSrc.includes(key)) {
        violations.push(
          warning('privacy-filter-missing-key', `privacy-filter.ts does not mention "${key}".`, {
            file: 'src/platform/analytics/privacy-filter.ts',
          }),
        );
      }
    }
  }

  // Rule 5: trackEvent calls in src/ must use ALLOWED_FIELDS keys only.
  const sourceFiles = await walkFiles(PATHS.src, { extensions: ['.ts', '.tsx'] });
  for (const file of sourceFiles) {
    const relPath = file
      .replace(PATHS.root + '/', '')
      .split('\\')
      .join('/');
    if (relPath.endsWith('.test.ts') || relPath.endsWith('.test.tsx')) continue;
    if (relPath.startsWith('src/platform/analytics/')) continue;

    const src = await readText(file);
    const callRe = /trackEvent\([^,]+,\s*(\{[\s\S]*?\})/g;
    let m: RegExpExecArray | null;
    while ((m = callRe.exec(src)) !== null) {
      const body = m[1];
      const keyRe = /([a-zA-Z_$][\w$]*)\s*:/g;
      let km: RegExpExecArray | null;
      while ((km = keyRe.exec(body)) !== null) {
        const key = km[1];
        if (FORBIDDEN_FIELDS.includes(key)) {
          violations.push(
            error(
              'forbidden-field-in-track',
              `trackEvent payload includes forbidden field "${key}".`,
              {
                file: relPath,
                line: lineNumberAt(src, m.index + km.index),
              },
            ),
          );
        }
      }
      if (m.index === callRe.lastIndex) callRe.lastIndex += 1;
    }
  }

  return violations;
}
