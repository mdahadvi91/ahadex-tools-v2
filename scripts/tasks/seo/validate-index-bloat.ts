/**
 * Index bloat validator. Prevents pages that should not be indexed
 * from appearing in the sitemap or being linked:
 *   - Draft or deprecated tools must not be in sitemap
 *   - Utility pages (404, etc.) must not be in sitemap
 *   - Query-parameter variants must not be indexed
 *   - Static routes without canonical must be flagged
 */

import { readText, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { discoverTools } from '../../utils/route-discovery';
import { error, warning, type Violation } from '../../utils/validation-result';

/** Paths that must never appear in sitemap. */
const NEVER_INDEX = [
  '/404',
  '/preview',
  '/admin',
  '/draft',
  '/test',
  '/temp',
  '/private',
  '/internal',
  '/search',
];

/** Utility patterns that bloat the index. */
const BLOAT_PATTERNS = [/\?/, /\/filter\//, /\/tag\//, /\/page\//];

function extractSitemapLocs(xml: string): string[] {
  const locs: string[] = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    locs.push(m[1].trim());
  }
  return locs;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  if (!(await pathExists(PATHS.publicSitemap))) {
    return [
      warning('sitemap-missing', 'public/sitemap.xml is missing. Index bloat cannot be checked.', {
        file: 'public/sitemap.xml',
      }),
    ];
  }

  const xml = await readText(PATHS.publicSitemap);
  const locs = extractSitemapLocs(xml);
  const { tools } = await discoverTools();
  const nonIndexable = new Set(
    tools
      .filter((t) => t.manifest.status !== 'live' || !t.manifest.indexable || !t.manifest.sitemap)
      .map((t) => t.manifest.path),
  );

  for (const loc of locs) {
    const url = new URL(loc);
    const path = url.pathname;

    // Rule 1: no NEVER_INDEX paths.
    for (const forbidden of NEVER_INDEX) {
      if (path === forbidden || path.startsWith(forbidden + '/')) {
        violations.push(
          error('sitemap-index-bloat', `Sitemap contains forbidden path "${path}".`, {
            file: 'public/sitemap.xml',
            hint: `"${forbidden}" must not be indexed.`,
          }),
        );
      }
    }

    // Rule 2: no query parameters.
    if (BLOAT_PATTERNS.some((p) => p.test(path)) || url.search !== '') {
      violations.push(
        warning(
          'sitemap-query-param',
          `Sitemap URL has query parameters or filter segments: ${path}.`,
          { file: 'public/sitemap.xml' },
        ),
      );
    }

    // Rule 3: no non-indexable tools.
    if (nonIndexable.has(path)) {
      violations.push(
        error('sitemap-non-indexable-tool', `Sitemap contains non-indexable tool: ${path}.`, {
          file: 'public/sitemap.xml',
        }),
      );
    }
  }

  return violations;
}
