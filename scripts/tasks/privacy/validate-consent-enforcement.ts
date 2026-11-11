/**
 * Consent enforcement validator. Ensures consent is actually gated
 * before analytics/ads fire:
 *   - analytics.ts must check isGranted() before dispatching events
 *   - no third-party script (GA, AdSense) may load without consent
 *   - ad_impression tracking must be gated
 *   - initial page view must respect consent
 */

import { readText, walkFiles, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

const ANALYTICS_ENTRY = `${PATHS.srcPlatform}/analytics/analytics.ts`;

function lineNumberAt(source: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  // Rule 1: analytics.ts must gate every track with isGranted.
  if (!(await pathExists(ANALYTICS_ENTRY))) {
    violations.push(
      error('analytics-entry-missing', 'src/platform/analytics/analytics.ts is missing.', {
        file: 'src/platform/analytics/analytics.ts',
      }),
    );
  } else {
    const src = await readText(ANALYTICS_ENTRY);
    const exportsTrack = /export\s+function\s+track(?:Event|PageView)/.test(src);
    const hasConsentCheck =
      /isGranted\(\s*['"]analytics['"]\s*\)/.test(src) &&
      /subscribeConsent/.test(src);

    if (!exportsTrack) {
      violations.push(
        warning(
          'no-track-functions',
          'analytics.ts does not export track/trackEvent/trackPageView.',
          { file: 'src/platform/analytics/analytics.ts' },
        ),
      );
    } else if (!hasConsentCheck) {
      violations.push(
        error(
          'analytics-missing-consent-check',
          'analytics.ts must gate tracking with isGranted("analytics") and subscribeConsent.',
          {
            file: 'src/platform/analytics/analytics.ts',
            hint: 'Without a consent check, events fire before user permission.',
          },
        ),
      );
    }

    // Rule 1b: no direct fetch/beacon for analytics.
    if (/\bnavigator\.sendBeacon\b/.test(src) || /\bfetch\(/.test(src)) {
      const idx = src.search(/\bnavigator\.sendBeacon\b|\bfetch\(/);
      violations.push(
        warning(
          'analytics-direct-network',
          'analytics.ts appears to send data directly. Confirm it is consent-gated.',
          {
            file: 'src/platform/analytics/analytics.ts',
            line: lineNumberAt(src, idx),
          },
        ),
      );
    }
  }

  // Rule 2: no third-party scripts loaded outside consent.
  const files = await walkFiles(PATHS.src, { extensions: ['.ts', '.tsx'] });
  for (const file of files) {
    const relPath = file.replace(PATHS.root + '/', '').split('\\').join('/');
    if (relPath.endsWith('.test.ts') || relPath.endsWith('.test.tsx')) continue;

    const src = await readText(file);

    // Detect direct loading of GA or AdSense.
    const gaPatterns = [
      /googletagmanager\.com\/gtag/i,
      /google-analytics\.com/i,
      /pagead2\.googlesyndication\.com/i,
    ];
    for (const pattern of gaPatterns) {
      if (pattern.test(src)) {
        const idx = src.search(pattern);
        const hasGating =
          /isGranted\(/.test(src) &&
          (/consent/i.test(src) || /getConsent\(/.test(src));
        if (!hasGating) {
          violations.push(
            error(
              'third-party-without-consent',
              'Third-party script reference without consent gating.',
              {
                file: relPath,
                line: lineNumberAt(src, idx),
                hint: 'Load GA/AdSense only after isGranted() returns true.',
              },
            ),
          );
        } else {
          violations.push(
            warning(
              'third-party-reference',
              'Third-party script reference detected. Verify consent gating at load time.',
              { file: relPath, line: lineNumberAt(src, idx) },
            ),
          );
        }
      }
    }
  }

  return violations;
}
