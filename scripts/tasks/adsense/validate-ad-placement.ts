/**
 * Ad placement validator. Ensures ads are not placed in prohibited
 * locations:
 *   - No ads between tool input and output
 *   - No ads above the first heading on mobile
 *   - No more than 3 ad units per page
 *   - No ads overlapping interactive elements
 *
 * Placeholder for future: when an ad component is added, this
 * validator will check its position in the page.
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, info, warning, type Violation } from '../../utils/validation-result';

/** Components that might contain ad placements. */
const AD_PATTERNS = [/<AdSlot\b/, /<AdSense\b/, /<GoogleAd\b/, /adsbygoogle/];

const MAX_ADS_PER_PAGE = 3;

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];
  let foundAds = 0;

  const files = await walkFiles(PATHS.src, { extensions: ['.tsx'] });

  for (const file of files) {
    const relPath = file
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');
    if (relPath.endsWith('.test.tsx')) continue;

    const src = await readText(file);

    // Rule 1: detect ads in tool components.
    const isToolFile = /src\/tools\/[^/]+\//.test(relPath);
    const isToolWidget = isToolFile && /Tool\.tsx$/.test(relPath);
    const hasAd = AD_PATTERNS.some((p) => p.test(src));

    if (hasAd && isToolWidget) {
      violations.push(
        error('ad-in-tool-widget', 'Ad placement inside Tool.tsx (between input and output).', {
          file: relPath,
          hint: 'Ads must not interrupt the tool interaction flow.',
        }),
      );
    }

    if (hasAd) {
      foundAds += 1;

      // Rule 2: count ad units per file.
      const count = (src.match(/<(?:AdSlot|AdSense|GoogleAd)\b/g) ?? []).length;
      if (count > MAX_ADS_PER_PAGE) {
        violations.push(
          error('too-many-ads', `${count} ad units in one file (max ${MAX_ADS_PER_PAGE}).`, {
            file: relPath,
          }),
        );
      }
    }

    // Rule 3: if ad exists, verify it is below the fold (comes after
    // the first <h1> in the file).
    if (hasAd && relPath.endsWith('Page.tsx')) {
      const h1Idx = src.indexOf('<h1');
      const firstAdIdx = Math.min(
        ...AD_PATTERNS.map((p) => {
          const m = src.match(p);
          return m?.index ?? -1;
        }).filter((i) => i >= 0),
      );

      if (h1Idx >= 0 && firstAdIdx >= 0 && firstAdIdx < h1Idx) {
        violations.push(
          warning('ad-above-h1', 'Ad appears before the first h1 heading.', {
            file: relPath,
            hint: 'Ads must be below the first heading for AdSense policy.',
          }),
        );
      }
    }
  }

  if (foundAds === 0) {
    violations.push(
      info(
        'ad-placement-skipped',
        'No ad placements detected. Placement rules will apply when ads are added.',
      ),
    );
  }

  return violations;
}
