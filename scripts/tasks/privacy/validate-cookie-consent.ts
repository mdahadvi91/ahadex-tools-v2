/**
 * Cookie consent validator. Ensures:
 *   - consent-manager.ts exists and exports required API
 *   - cookie-manager.ts exists and exports required API
 *   - consent-manager uses cookie-manager (no inline cookie code)
 *   - Cookie policy page exists and references consent
 *   - Consent cookie name is documented
 */

import { join } from 'node:path';
import { readText, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

const CONSENT_MANAGER = join(PATHS.srcPlatform, 'privacy/consent-manager.ts');
const COOKIE_MANAGER = join(PATHS.srcPlatform, 'privacy/cookie-manager.ts');
const COOKIE_PAGE = join(PATHS.srcPages, 'CookiePolicy.tsx');

const REQUIRED_CONSENT_EXPORTS = [
  'getConsent',
  'setConsent',
  'clearConsent',
  'isGranted',
  'subscribeConsent',
];

const REQUIRED_COOKIE_EXPORTS = [
  'getCookie',
  'setCookie',
  'deleteCookie',
];

function lineNumberAt(source: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  // Rule 1: consent-manager exists.
  if (!(await pathExists(CONSENT_MANAGER))) {
    violations.push(
      error('consent-manager-missing', 'src/platform/privacy/consent-manager.ts is missing.', {
        file: 'src/platform/privacy/consent-manager.ts',
      }),
    );
  } else {
    const src = await readText(CONSENT_MANAGER);

    for (const name of REQUIRED_CONSENT_EXPORTS) {
      if (!new RegExp(`export\\s+function\\s+${name}`).test(src)) {
        violations.push(
          error(
            'consent-export-missing',
            `consent-manager.ts must export "${name}".`,
            { file: 'src/platform/privacy/consent-manager.ts' },
          ),
        );
      }
    }

    // Must import cookie-manager, not inline cookie code.
    const importsCookieManager = /from\s+['"][^'"]*cookie-manager['"]/.test(src);
    if (!importsCookieManager) {
      violations.push(
        error(
          'consent-no-cookie-manager',
          'consent-manager.ts must import from cookie-manager.',
          {
            file: 'src/platform/privacy/consent-manager.ts',
            hint: 'Cookie read/write belongs in cookie-manager only.',
          },
        ),
      );
    }

    if (/document\.cookie\s*=/.test(src)) {
      const line = lineNumberAt(src, src.search(/document\.cookie\s*=/));
      violations.push(
        error(
          'consent-inline-cookie',
          'consent-manager.ts must not write document.cookie directly.',
          {
            file: 'src/platform/privacy/consent-manager.ts',
            line,
            hint: 'Use setCookie/deleteCookie from cookie-manager.',
          },
        ),
      );
    }

    // Must document the consent cookie name.
    if (!/COOKIE_NAME\s*=/.test(src)) {
      violations.push(
        warning(
          'consent-no-cookie-name',
          'consent-manager.ts should declare a named consent cookie.',
          { file: 'src/platform/privacy/consent-manager.ts' },
        ),
      );
    }
  }

  // Rule 2: cookie-manager exists.
  if (!(await pathExists(COOKIE_MANAGER))) {
    violations.push(
      error('cookie-manager-missing', 'src/platform/privacy/cookie-manager.ts is missing.', {
        file: 'src/platform/privacy/cookie-manager.ts',
      }),
    );
  } else {
    const src = await readText(COOKIE_MANAGER);
    for (const name of REQUIRED_COOKIE_EXPORTS) {
      if (!new RegExp(`export\\s+function\\s+${name}`).test(src)) {
        violations.push(
          error(
            'cookie-export-missing',
            `cookie-manager.ts must export "${name}".`,
            { file: 'src/platform/privacy/cookie-manager.ts' },
          ),
        );
      }
    }
  }

  // Rule 3: Cookie Policy page exists and mentions consent.
  if (!(await pathExists(COOKIE_PAGE))) {
    violations.push(
      error('cookie-page-missing', 'src/pages/CookiePolicy.tsx is missing.', {
        file: 'src/pages/CookiePolicy.tsx',
      }),
    );
  } else {
    const src = await readText(COOKIE_PAGE);
    if (!/consent/i.test(src)) {
      violations.push(
        warning(
          'cookie-page-no-consent',
          'Cookie Policy page does not mention consent.',
          { file: 'src/pages/CookiePolicy.tsx' },
        ),
      );
    }
  }

  return violations;
}
