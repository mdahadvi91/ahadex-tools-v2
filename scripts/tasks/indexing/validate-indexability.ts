/**
 * Indexability validator. Ensures every tool manifest declares
 * `indexable`, `sitemap` and `status` consistently:
 *   - live + indexable => must be in sitemap
 *   - draft or deprecated => must not be indexable
 *   - sitemap: true requires indexable: true
 */

import { readText, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { discoverTools } from '../../utils/route-discovery';
import { error, warning, type Violation } from '../../utils/validation-result';

function extractSitemapLocs(xml: string): Set<string> {
  const locs = new Set<string>();
  const re = /<loc>([^<]+)<\/loc>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) {
    locs.add(match[1].trim());
  }
  return locs;
}

function getSiteUrl(): string {
  const url = process.env.VITE_SITE_URL?.trim() ?? '';
  return url.replace(/\/+$/, '');
}

function joinUrl(base: string, path: string): string {
  if (path === '/' || path === '') return `${base}/`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];
  const { tools, errors } = await discoverTools();

  for (const parseError of errors) {
    violations.push(
      error('tool-manifest-error', parseError, {
        file: 'scripts/utils/route-discovery.ts',
      }),
    );
  }

  let sitemapLocs = new Set<string>();
  let hasSitemap = false;
  if (await pathExists(PATHS.publicSitemap)) {
    const xml = await readText(PATHS.publicSitemap);
    sitemapLocs = extractSitemapLocs(xml);
    hasSitemap = true;
  }

  const siteUrl = getSiteUrl();

  for (const tool of tools) {
    const { manifest, filePath } = tool;
    const relPath = filePath.replace(PATHS.root + '/', '').split('\\').join('/');

    // Rule: draft or deprecated => not indexable.
    if (manifest.status !== 'live' && manifest.indexable) {
      violations.push(
        error(
          'non-live-indexable',
          `Tool "${manifest.slug}" has status "${manifest.status}" but indexable=true.`,
          {
            file: relPath,
            hint: 'Only live tools may be indexable.',
          },
        ),
      );
    }

    // Rule: sitemap requires indexable.
    if (manifest.sitemap && !manifest.indexable) {
      violations.push(
        error(
          'sitemap-not-indexable',
          `Tool "${manifest.slug}" has sitemap=true but indexable=false.`,
          { file: relPath },
        ),
      );
    }

    // Rule: live + indexable + sitemap must appear in sitemap.xml.
    if (manifest.status === 'live' && manifest.indexable && manifest.sitemap) {
      if (!hasSitemap) {
        violations.push(
          warning(
            'sitemap-missing-for-live-tool',
            `Tool "${manifest.slug}" should be in sitemap but sitemap.xml is missing.`,
            { file: relPath, hint: 'Run `npm run generate:sitemap`.' },
          ),
        );
      } else if (siteUrl) {
        const expected = joinUrl(siteUrl, manifest.path);
        if (!sitemapLocs.has(expected)) {
          violations.push(
            error(
              'tool-missing-from-sitemap',
              `Live tool "${manifest.slug}" is missing from sitemap: ${expected}`,
              {
                file: relPath,
                hint: 'Regenerate sitemap after changing the manifest.',
              },
            ),
          );
        }
      }
    }

    // Rule: path must start with /tools/.
    if (!manifest.path.startsWith('/tools/')) {
      violations.push(
        error(
          'invalid-tool-path',
          `Tool path "${manifest.path}" must start with /tools/.`,
          { file: relPath },
        ),
      );
    }

    // Rule: title and description must be non-empty.
    if (manifest.title.trim().length === 0) {
      violations.push(
        error('empty-tool-title', `Tool "${manifest.slug}" has empty title.`, {
          file: relPath,
        }),
      );
    }
    if (manifest.description.trim().length === 0) {
      violations.push(
        error(
          'empty-tool-description',
          `Tool "${manifest.slug}" has empty description.`,
          { file: relPath },
        ),
      );
    }
  }

  return violations;
}
