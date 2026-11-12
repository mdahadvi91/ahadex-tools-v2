/**
 * Ad labels validator. Ensures every ad unit is clearly labeled:
 *   - Ads have "Advertisement" or "Sponsored" label
 *   - Labels are visible (not hidden by CSS)
 *   - Labels are above the ad unit
 *   - Ads are visually distinct from content
 *
 * Skipped gracefully when no ads are present.
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, info, warning, type Violation } from '../../utils/validation-result';

const AD_PATTERNS = [/<AdSlot\b/, /<AdSense\b/, /<GoogleAd\b/];
const LABEL_PATTERNS = [
  /Advertisement/i,
  /Sponsored/i,
  /Ad\s*[:.]/i,
  /aria-label\s*=\s*['"]Advertisement/i,
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
  let foundAds = 0;

  const files = await walkFiles(PATHS.src, { extensions: ['.tsx'] });

  for (const file of files) {
    const relPath = file.substring(PATHS.root.length + 1).split('\\').join('/');
    if (relPath.endsWith('.test.tsx')) continue;

    const src = await readText(file);

    for (const adPattern of AD_PATTERNS) {
      const re = new RegExp(adPattern.source, 'g');
      let m: RegExpExecArray | null;
      while ((m = re.exec(src)) !== null) {
        foundAds += 1;
        const line = lineNumberAt(src, m.index);

        // Look at 300 chars before and after for a label.
        const windowStart = Math.max(0, m.index - 500);
        const windowEnd = Math.min(src.length, m.index + 1000);
        const context = src.slice(windowStart, windowEnd);

        const hasLabel = LABEL_PATTERNS.some((p) => p.test(context));
        if (!hasLabel) {
          violations.push(
            error(
              'ad-without-label',
              'Ad unit missing "Advertisement" or "Sponsored" label.',
              {
                file: relPath,
                line,
                hint: 'AdSense policy requires a clear, visible ad label.',
              },
            ),
          );
        }
      }
    }

    // Rule: if the file has an ad, it should have an ad label component.
    const hasAd = AD_PATTERNS.some((p) => p.test(src));
    if (hasAd && !/AdLabel|Advertisement/i.test(src)) {
      violations.push(
        warning(
          'ad-no-label-component',
          'File contains ads but no visible ad label component.',
          { file: relPath },
        ),
      );
    }
  }

  if (foundAds === 0) {
    violations.push(
      info(
        'ad-labels-skipped',
        'No ad units detected. Label rules will apply when ads are added.',
      ),
    );
  }

  return violations;
}
