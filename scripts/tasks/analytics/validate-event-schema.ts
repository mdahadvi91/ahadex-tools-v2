/**
 * Event schema validator. Ensures every tracked event has a
 * corresponding entry in events.ts and event-schema.ts:
 *   - ANALYTICS_EVENTS and EventPayloadMap cover the same names.
 *   - REQUIRED_FIELDS in event-schema covers every event.
 *   - No raw string event names appear outside events.ts.
 */

import { join } from 'node:path';
import { readText, walkFiles, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

const EVENTS_FILE = join(PATHS.srcPlatform, 'analytics/events.ts');
const SCHEMA_FILE = join(PATHS.srcPlatform, 'analytics/event-schema.ts');

/** Extracts the values (snake_case event names) of ANALYTICS_EVENTS.
 *  These values are the canonical names used in EventPayloadMap and
 *  REQUIRED_FIELDS. */
function extractEventNames(src: string): string[] {
  const names: string[] = [];
  const block = src.match(/ANALYTICS_EVENTS\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\s*as const\)/);
  if (!block) return names;
  const valRe = /:\s*['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = valRe.exec(block[1])) !== null) {
    names.push(m[1]);
  }
  return names;
}

/** Extracts keys of EventPayloadMap. */
function extractPayloadMapKeys(src: string): string[] {
  const keys: string[] = [];
  const block = src.match(/interface\s+EventPayloadMap\s*\{([\s\S]*?)\n\}/);
  if (!block) return keys;
  const keyRe = /^\s*(?:['"]([^'"]+)['"]|([a-zA-Z_][\w]*))\s*:/gm;
  let m: RegExpExecArray | null;
  while ((m = keyRe.exec(block[1])) !== null) {
    keys.push(m[1] ?? m[2]);
  }
  return keys;
}

/** Extracts keys of REQUIRED_FIELDS in event-schema.ts. */
function extractRequiredFields(src: string): string[] {
  const keys: string[] = [];
  const block = src.match(/REQUIRED_FIELDS\s*:[^=]*=\s*\{([\s\S]*?)\n\};/);
  if (!block) return keys;
  const keyRe = /^\s*(?:['"]([^'"]+)['"]|([a-zA-Z_][\w]*))\s*:/gm;
  let m: RegExpExecArray | null;
  while ((m = keyRe.exec(block[1])) !== null) {
    keys.push(m[1] ?? m[2]);
  }
  return keys;
}

function lineNumberAt(src: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < src.length; i++) {
    if (src.charCodeAt(i) === 10) count += 1;
  }
  return count;
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
  const eventKeys = extractEventNames(eventsSrc);
  const eventValues = eventKeys; // same values, kept for clarity
  const payloadKeys = extractPayloadMapKeys(eventsSrc);

  // Rule 1: every event key must have a payload entry.
  for (const key of eventKeys) {
    if (!payloadKeys.includes(key)) {
      violations.push(
        error('event-without-payload', `Event "${key}" has no entry in EventPayloadMap.`, {
          file: 'src/platform/analytics/events.ts',
          hint: 'Add a payload interface for this event.',
        }),
      );
    }
  }

  // Rule 2: event values must be unique.
  const valueCounts = new Map<string, number>();
  for (const v of eventValues) valueCounts.set(v, (valueCounts.get(v) ?? 0) + 1);
  for (const [v, count] of valueCounts) {
    if (count > 1) {
      violations.push(
        error('duplicate-event-value', `Event string "${v}" is used ${count} times.`, {
          file: 'src/platform/analytics/events.ts',
        }),
      );
    }
  }

  // Rule 3: event-schema.ts must cover every event.
  if (!(await pathExists(SCHEMA_FILE))) {
    violations.push(
      error('schema-file-missing', 'src/platform/analytics/event-schema.ts is missing.', {
        file: 'src/platform/analytics/event-schema.ts',
      }),
    );
  } else {
    const schemaSrc = await readText(SCHEMA_FILE);
    const schemaKeys = extractRequiredFields(schemaSrc);

    for (const key of eventKeys) {
      if (!schemaKeys.includes(key)) {
        violations.push(
          error('event-not-in-schema', `Event "${key}" has no entry in REQUIRED_FIELDS.`, {
            file: 'src/platform/analytics/event-schema.ts',
            hint: 'Add required field list for this event.',
          }),
        );
      }
    }

    for (const key of schemaKeys) {
      if (!eventKeys.includes(key)) {
        violations.push(
          warning('schema-entry-orphan', `REQUIRED_FIELDS has "${key}" but no matching event.`, {
            file: 'src/platform/analytics/event-schema.ts',
          }),
        );
      }
    }
  }

  // Rule 4: no raw event strings outside events.ts / event-schema.ts.
  const sourceFiles = await walkFiles(PATHS.src, { extensions: ['.ts', '.tsx'] });
  const knownValues = new Set(eventValues);
  for (const file of sourceFiles) {
    const relPath = file
      .replace(PATHS.root + '/', '')
      .split('\\')
      .join('/');
    if (relPath.endsWith('.test.ts') || relPath.endsWith('.test.tsx')) continue;
    if (relPath === 'src/platform/analytics/events.ts') continue;
    if (relPath === 'src/platform/analytics/event-schema.ts') continue;

    const src = await readText(file);
    for (const value of knownValues) {
      const pattern = new RegExp(`['"]${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`);
      const match = pattern.exec(src);
      if (match) {
        violations.push(
          warning('raw-event-string', `Raw event string "${value}" used outside events.ts.`, {
            file: relPath,
            line: lineNumberAt(src, match.index),
            hint: 'Import the constant from ANALYTICS_EVENTS.',
          }),
        );
      }
    }
  }

  return violations;
}
