/**
 * Tracking privacy validator. Ensures no tracking fires before consent
 * is granted:
 *   - no analytics/fingerprinting APIs called outside consent gates
 *   - no cookies set before consent (except consent cookie)
 *   - no third-party domains called at startup
 *   - consent mode is respected in ads and analytics modules
 */

import { join } from 'node:path';
import { readText, walkFiles, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

const CONSENT_MANAGER = join(PATHS.srcPlatform, 'privacy/consent-manager.ts');
const COOKIE_MANAGER = join(PATHS.srcPlatform, 'privacy/cookie-manager.ts');

/** Cookie names allowed to be set without consent. */
const PRE_CONSENT_COOKIE_NAMES = new Set(['ahx_consent']);

const FORBIDDEN_PRE_CONSENT_APIS = [
  { name: 'navigator.sendBeacon', pattern: /\bnavigator\.sendBeacon\b/ },
  { name: 'window.gtag', pattern: /\bwindow\.gtag\b/ },
  { name: 'window.dataLayer', pattern: /\bwindow\.dataLayer\b/ },
  { name: 'fbq (Facebook Pixel)', pattern: /\bfbq\s*\(/ },
  { name: 'fingerprint', pattern: /\bfingerprint(?:js|ing)?\b/i },
];

const THIRD_PARTY_DOMAINS = [
  'google-analytics.com',
  'googletagmanager.com',
  'googlesyndication.com',
  'doubleclick.net',
  'facebook.com',
  'facebook.net',
];

function lineNumberAt(source: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

function isGated(src: string, index: number): boolean {
  // Look at the 500 chars before the match; if isGranted or getConsent
  // appear in the same scope, assume gated.
  const window = src.slice(Math.max(0, index - 500), index + 200);
  return /isGranted\(|getConsent\(|subscribeConsent\(/.test(window);
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  // Rule 1: consent-manager exists (baseline dependency).
  if (!(await pathExists(CONSENT_MANAGER))) {
    violations.push(
      error('consent-manager-missing', 'src/platform/privacy/consent-manager.ts is missing.', {
        file: 'src/platform/privacy/consent-manager.ts',
      }),
    );
  }

  // Rule 2: cookie writes must honor the allowlist before consent.
  if (await pathExists(COOKIE_MANAGER)) {
    const cmSrc = await readText(COOKIE_MANAGER);

    // cookie-manager itself is the only place cookies should be set.
    // Confirm it doesn't auto-set tracking cookies at import time.
    const topLevelSet = /^setCookie\(/m.test(cmSrc);
    if (topLevelSet) {
      violations.push(
        error('cookie-set-at-import', 'cookie-manager.ts sets a cookie at module load.', {
          file: 'src/platform/privacy/cookie-manager.ts',
        }),
      );
    }
  }

  // Rule 3: scan src for tracking APIs that must be gated.
  const files = await walkFiles(PATHS.src, { extensions: ['.ts', '.tsx'] });
  for (const file of files) {
    const relPath = file
      .replace(PATHS.root + '/', '')
      .split('\\')
      .join('/');
    if (relPath.endsWith('.test.ts') || relPath.endsWith('.test.tsx')) continue;

    const src = await readText(file);

    for (const api of FORBIDDEN_PRE_CONSENT_APIS) {
      const re = new RegExp(
        api.pattern.source,
        api.pattern.flags.includes('g') ? api.pattern.flags : api.pattern.flags + 'g',
      );
      let match: RegExpExecArray | null;
      while ((match = re.exec(src)) !== null) {
        if (!isGated(src, match.index)) {
          violations.push(
            error('tracking-ungated', `Tracking API "${api.name}" used without consent gate.`, {
              file: relPath,
              line: lineNumberAt(src, match.index),
              hint: 'Wrap in isGranted("analytics") or isGranted("ads").',
            }),
          );
        }
        if (match.index === re.lastIndex) re.lastIndex += 1;
        break;
      }
    }

    for (const domain of THIRD_PARTY_DOMAINS) {
      const idx = src.indexOf(domain);
      if (idx === -1) continue;
      if (!isGated(src, idx)) {
        violations.push(
          error(
            'third-party-ungated',
            `Third-party domain "${domain}" referenced without consent gate.`,
            {
              file: relPath,
              line: lineNumberAt(src, idx),
              hint: 'Load third-party scripts only after consent.',
            },
          ),
        );
      }
    }

    // Rule 4: setCookie calls in non-cookie-manager files must be consent-gated
    // or use an allowlisted cookie name.
    if (!relPath.endsWith('/cookie-manager.ts')) {
      const cookieRe = /\bsetCookie\(\s*['"]([^'"]+)['"]/g;
      let cookieMatch: RegExpExecArray | null;
      while ((cookieMatch = cookieRe.exec(src)) !== null) {
        const name = cookieMatch[1];
        if (!PRE_CONSENT_COOKIE_NAMES.has(name) && !isGated(src, cookieMatch.index)) {
          violations.push(
            warning('cookie-set-ungated', `Cookie "${name}" set outside consent gate.`, {
              file: relPath,
              line: lineNumberAt(src, cookieMatch.index),
            }),
          );
        }
        if (cookieMatch.index === cookieRe.lastIndex) cookieRe.lastIndex += 1;
      }
    }
  }

  return violations;
}
