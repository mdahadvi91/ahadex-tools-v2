/**
 * URL coverage validator. Compares the routes the app declares
 * (static + live tools) with what appears in sitemap.xml. Every
 * public, indexable route must be in the sitemap; the sitemap must
 * not contain stale routes that no longer exist.
 */

import { readText, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { discoverTools } from '../../utils/route-discovery';
import { error, warning, type Violation } from '../../utils/validation-result';

/** Static routes the app exposes. Kept in sync with
 *  src/router/routes.tsx. */
const STATIC_ROUTES = [
  '/',
  '/tools',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/disclaimer',
  '/cookies',
];

function getSiteUrl(): string | null {
  const url = process.env.VITE_SITE_URL?.trim();
  if (!url) return null;
  return url.replace(/\/+$/, '');
}

function joinUrl(base: string, path: string): string {
  if (path === '/' || path === '') return `${base}/`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function extractLocs(xml: string): string[] {
  const locs: string[] = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) {
    locs.push(match[1].trim());
  }
  return locs;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const siteUrl = getSiteUrl();
  if (!siteUrl) {
    return [
      warning('coverage-no-site-url', 'VITE_SITE_URL not set; cannot validate URL coverage.', {
        hint: 'Set VITE_SITE_URL in .env or CI environment.',
      }),
    ];
  }

  if (!(await pathExists(PATHS.publicSitemap))) {
    return [
      error('coverage-missing-sitemap', 'public/sitemap.xml is missing.', {
        file: 'public/sitemap.xml',
        hint: 'Run `npm run generate:sitemap`.',
      }),
    ];
  }

  const xml = await readText(PATHS.publicSitemap);
  const sitemapLocs = new Set(extractLocs(xml));

  // Build the set of expected routes: static + live indexable tools.
  const expected = new Set<string>();
  for (const path of STATIC_ROUTES) {
    expected.add(joinUrl(siteUrl, path));
  }

  const { tools } = await discoverTools();
  for (const tool of tools) {
    if (tool.manifest.status === 'live' && tool.manifest.indexable && tool.manifest.sitemap) {
      expected.add(joinUrl(siteUrl, tool.manifest.path));
    }
  }

  // Every expected route must be in the sitemap.
  for (const url of expected) {
    if (!sitemapLocs.has(url)) {
      violations.push(
        error('url-missing-from-sitemap', `Expected URL is missing from sitemap: ${url}`, {
          file: 'public/sitemap.xml',
        }),
      );
    }
  }

  // Every sitemap entry must be an expected route (no stale URLs).
  for (const url of sitemapLocs) {
    if (!expected.has(url)) {
      violations.push(
        error('stale-sitemap-url', `Sitemap contains a URL that is no longer expected: ${url}`, {
          file: 'public/sitemap.xml',
          hint: 'Regenerate the sitemap; remove stale routes.',
        }),
      );
    }
  }

  return violations;
}
