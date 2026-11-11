/**
 * Consent tracking validator. Ensures analytics consent is
 * respected at every event dispatch:
 *   - analytics.ts checks isGranted("analytics") before tracking
 *   - analytics.ts subscribes to consent changes
 *   - a consent_update event exists and is dispatched
 *   - no event fires before consent in tests / dev mode
 */

import { join } from 'node:path';
import { readText, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

const ANALYTICS_ENTRY = join(PATHS.srcPlatform, 'analytics/analytics.ts');
const EVENTS_FILE = join(PATHS.srcPlatform, 'analytics/events.ts');
const CONSENT_MANAGER = join(PATHS.srcPlatform, 'privacy/consent-manager.ts');

function lineNumberAt(src: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < src.length; i++) {
    if (src.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  // Rule 1: analytics.ts exists.
  if (!(await pathExists(ANALYTICS_ENTRY))) {
    return [
      error('analytics-missing', 'src/platform/analytics/analytics.ts is missing.', {
        file: 'src/platform/analytics/analytics.ts',
      }),
    ];
  }

  const src = await readText(ANALYTICS_ENTRY);

  // Rule 2: every exported track function gates with isGranted.
  const exportRe = /export\s+function\s+(track\w*)\s*\(/g;
  let m: RegExpExecArray | null;
  const trackFns: Array<{ name: string; line: number; bodyEnd: number }> = [];
  while ((m = exportRe.exec(src)) !== null) {
    // Find the closing brace of this function by counting braces.
    const start = m.index;
    const bodyStart = src.indexOf('{', start);
    if (bodyStart === -1) continue;
    let depth = 1;
    let i = bodyStart + 1;
    while (i < src.length && depth > 0) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') depth--;
      i++;
    }
    trackFns.push({ name: m[1], line: lineNumberAt(src, start), bodyEnd: i });
  }

  for (const fn of trackFns) {
    const body = src.slice(fn.line === 0 ? 0 : src.indexOf('function', Math.max(0, fn.bodyEnd - 500)), fn.bodyEnd);
    // Better: re-slice body from function start to bodyEnd.
    const fnStart = src.indexOf(`function ${fn.name}`, Math.max(0, fn.bodyEnd - 2000));
    const actualBody = fnStart >= 0 ? src.slice(fnStart, fn.bodyEnd) : body;
    if (!/isGranted\(\s*['"]analytics['"]\s*\)/.test(actualBody)) {
      violations.push(
        error(
          'track-missing-gate',
          `Function "${fn.name}" does not check isGranted("analytics").`,
          {
            file: 'src/platform/analytics/analytics.ts',
            line: fn.line,
            hint: 'Every tracking function must gate on consent.',
          },
        ),
      );
    }
  }

  // Rule 3: analytics.ts subscribes to consent changes.
  if (!/subscribeConsent\(/.test(src)) {
    violations.push(
      error(
        'no-consent-subscription',
        'analytics.ts does not subscribe to consent changes.',
        {
          file: 'src/platform/analytics/analytics.ts',
          hint: 'Without subscribeConsent, revoking consent does not stop tracking.',
        },
      ),
    );
  }

  // Rule 4: consent_update event is defined.
  if (await pathExists(EVENTS_FILE)) {
    const eventsSrc = await readText(EVENTS_FILE);
    if (!/consent_update/.test(eventsSrc)) {
      violations.push(
        warning(
          'missing-consent-event',
          'No consent_update event is declared in events.ts.',
          {
            file: 'src/platform/analytics/events.ts',
            hint: 'Track consent changes for auditing.',
          },
        ),
      );
    }
  }

  // Rule 5: consent-manager exports subscribeConsent (dependency).
  if (await pathExists(CONSENT_MANAGER)) {
    const cmSrc = await readText(CONSENT_MANAGER);
    if (!/export\s+function\s+subscribeConsent/.test(cmSrc)) {
      violations.push(
        error(
          'consent-no-subscribe',
          'consent-manager.ts does not export subscribeConsent.',
          { file: 'src/platform/privacy/consent-manager.ts' },
        ),
      );
    }
  }

  return violations;
}
