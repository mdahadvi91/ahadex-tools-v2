/**
 * Sitemap validator. Checks that public/sitemap.xml exists, is valid
 * XML, contains the expected static routes, and has no duplicates.
 */

import { readText, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

const EXPECTED_STATIC_PATHS = [
  '/',
  '/tools',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/disclaimer',
  '/cookies',
];

function extractLocs(xml: string): string[] {
  const locs: string[] = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) {
    locs.push(match[1].trim());
  }
  return locs;
}

function getSiteUrl(): string | null {
  const url = process.env.VITE_SITE_URL?.trim();
  if (!url) return null;
  return url.replace(/\/+$/, '');
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  if (!(await pathExists(PATHS.publicSitemap))) {
    return [
      error('sitemap-missing', 'public/sitemap.xml is missing.', {
        file: 'public/sitemap.xml',
        hint: 'Run `npm run generate:sitemap` or `npm run build`.',
      }),
    ];
  }

  const xml = await readText(PATHS.publicSitemap);

  if (!xml.includes('<urlset')) {
    violations.push(
      error('sitemap-invalid-xml', 'Missing <urlset> root element.', {
        file: 'public/sitemap.xml',
      }),
    );
  }
  if (!xml.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) {
    violations.push(
      error('sitemap-invalid-ns', 'Missing sitemap namespace declaration.', {
        file: 'public/sitemap.xml',
      }),
    );
  }

  const locs = extractLocs(xml);

  if (locs.length === 0) {
    violations.push(
      error('sitemap-empty', 'Sitemap contains zero <url> entries.', {
        file: 'public/sitemap.xml',
      }),
    );
    return violations;
  }

  // Duplicate loc detection.
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const loc of locs) {
    if (seen.has(loc)) duplicates.add(loc);
    else seen.add(loc);
  }
  for (const dup of duplicates) {
    violations.push(
      error('sitemap-duplicate', `Duplicate <loc>: ${dup}`, {
        file: 'public/sitemap.xml',
      }),
    );
  }

  // Every expected static path must be present.
  const siteUrl = getSiteUrl();
  if (siteUrl === null) {
    violations.push(
      warning('sitemap-no-site-url', 'VITE_SITE_URL not set; skipping URL prefix validation.', {
        file: 'public/sitemap.xml',
      }),
    );
  } else {
    for (const path of EXPECTED_STATIC_PATHS) {
      const expected = path === '/' ? `${siteUrl}/` : `${siteUrl}${path}`;
      if (!locs.includes(expected)) {
        violations.push(
          error('sitemap-missing-route', `Expected route not found in sitemap: ${expected}`, {
            file: 'public/sitemap.xml',
          }),
        );
      }
    }
  }

  return violations;
}
