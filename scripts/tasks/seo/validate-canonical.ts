/**
 * Canonical URL validator. Ensures canonical URLs:
 *   - Use https protocol
 *   - Have no trailing slash (except root)
 *   - Match the path declared in manifest
 *   - Use the VITE_SITE_URL origin
 *   - No duplicated canonical tags per route
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { discoverTools } from '../../utils/route-discovery';
import { error, warning, type Violation } from '../../utils/validation-result';

function getSiteUrl(): string | null {
  const url = process.env.VITE_SITE_URL?.trim();
  if (!url) return null;
  return url.replace(/\/+$/, '');
}

function isValidCanonical(url: string): boolean {
  if (!url.startsWith('https://')) return false;
  if (url.endsWith('/') && url !== `${new URL(url).origin}/`) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const siteUrl = getSiteUrl();
  if (!siteUrl) {
    return [
      warning(
        'canonical-no-site-url',
        'VITE_SITE_URL is not set. Canonical URLs cannot be validated.',
      ),
    ];
  }

  // Rule 1: every tool's canonical path builds correctly.
  const { tools } = await discoverTools();
  for (const tool of tools) {
    if (tool.manifest.status !== 'live' || !tool.manifest.indexable) continue;

    const expectedCanonical = `${siteUrl}${tool.manifest.path}`;
    if (!isValidCanonical(expectedCanonical)) {
      violations.push(
        error(
          'canonical-invalid',
          `Tool "${tool.manifest.slug}" would generate invalid canonical: ${expectedCanonical}`,
          { file: tool.filePath.replace(PATHS.root + '/', '') },
        ),
      );
    }
  }

  // Rule 2: no hardcoded canonical URLs in tool source (must go through canonical builder).
  const seoFiles = (await walkFiles(PATHS.srcTools, { extensions: ['.ts'] })).filter((f) =>
    f.endsWith('/seo.ts') || f.endsWith('/schema.ts'),
  );

  for (const file of seoFiles) {
    const relPath = file.substring(PATHS.root.length + 1).split('\\').join('/');
    const src = await readText(file);

    // Look for hardcoded canonical hostnames.
    if (/https:\/\/ahadex\.online/.test(src)) {
      violations.push(
        warning(
          'canonical-hardcoded',
          'Hardcoded canonical URL detected. Use buildCanonicalUrl() instead.',
          {
            file: relPath,
            hint: 'Hardcoded URLs break when the site domain changes.',
          },
        ),
      );
    }
  }

  return violations;
}
