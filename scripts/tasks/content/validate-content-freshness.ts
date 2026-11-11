/**
 * Content freshness validator. Detects stale content that hurts SEO:
 *   - Content files should have a "lastReviewed" date in frontmatter-like form
 *   - Reviews older than 12 months trigger a warning
 *   - Content mentioning outdated years/dates (e.g. "in 2023") is flagged
 *   - No "last updated" date in content.ts is a warning
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { warning, type Violation } from '../../utils/validation-result';

const STALE_MONTHS = 12;

/** Extract "lastReviewed: 'YYYY-MM-DD'" or similar from content.ts. */
function extractLastReviewed(src: string): Date | null {
  // Accept a few formats.
  const patterns = [
    /lastReviewed\s*:\s*['"`](\d{4}-\d{2}-\d{2})['"`]/,
    /lastUpdated\s*:\s*['"`](\d{4}-\d{2}-\d{2})['"`]/,
    /reviewedAt\s*:\s*['"`](\d{4}-\d{2}-\d{2})['"`]/,
  ];
  for (const pattern of patterns) {
    const m = src.match(pattern);
    if (m) {
      const date = new Date(m[1]);
      if (!Number.isNaN(date.getTime())) return date;
    }
  }
  return null;
}

function monthsBetween(a: Date, b: Date): number {
  return (
    (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
  );
}

/** Look for outdated year references in string literals. */
function findOutdatedYears(src: string, currentYear: number): number[] {
  const years = new Set<number>();
  const re = /['"`][^'"`]*\b(20\d{2})\b[^'"`]*['"`]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const year = parseInt(m[1], 10);
    if (year < currentYear - 1 && year >= 2000) {
      years.add(year);
    }
  }
  return [...years].sort();
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const contentFiles = (await walkFiles(PATHS.srcTools, { extensions: ['.ts'] })).filter(
    (f) => f.endsWith('/content.ts'),
  );

  const now = new Date();
  const currentYear = now.getFullYear();

  for (const file of contentFiles) {
    const relPath = file.substring(PATHS.root.length + 1).split('\\').join('/');
    const slug = relPath.match(/tools\/([^/]+)\//)?.[1] ?? 'unknown';
    const src = await readText(file);

    // Rule 1: last reviewed date present.
    const lastReviewed = extractLastReviewed(src);
    if (!lastReviewed) {
      violations.push(
        warning(
          'content-no-review-date',
          `Tool "${slug}" has no "lastReviewed" date.`,
          {
            file: relPath,
            hint: "Add lastReviewed: 'YYYY-MM-DD' to content.ts for freshness tracking.",
          },
        ),
      );
    } else {
      const months = monthsBetween(lastReviewed, now);
      if (months > STALE_MONTHS) {
        violations.push(
          warning(
            'content-stale',
            `Content last reviewed ${months} months ago (${lastReviewed.toISOString().slice(0, 10)}).`,
            {
              file: relPath,
              hint: 'Review content every 12 months to maintain freshness signals.',
            },
          ),
        );
      }
    }

    // Rule 2: outdated year references.
    const outdated = findOutdatedYears(src, currentYear);
    for (const year of outdated) {
      violations.push(
        warning(
          'content-outdated-year',
          `Content mentions year ${year} which may be outdated.`,
          {
            file: relPath,
            hint: 'Update or remove outdated year references.',
          },
        ),
      );
    }
  }

  return violations;
}
