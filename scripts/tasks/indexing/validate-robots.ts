/**
 * Robots.txt validator. Ensures public/robots.txt exists, has valid
 * directives, references the sitemap, and does not accidentally
 * disallow the entire site.
 */

import { readText, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

const VALID_DIRECTIVES = new Set([
  'user-agent',
  'allow',
  'disallow',
  'sitemap',
  'crawl-delay',
  'host',
  'request-rate',
  'visit-time',
  'clean-param',
]);

function getSiteUrl(): string | null {
  const url = process.env.VITE_SITE_URL?.trim();
  if (!url) return null;
  return url.replace(/\/+$/, '');
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  if (!(await pathExists(PATHS.publicRobots))) {
    return [
      error('robots-missing', 'public/robots.txt is missing.', {
        file: 'public/robots.txt',
      }),
    ];
  }

  const content = await readText(PATHS.publicRobots);
  const lines = content.split('\n').map((l) => l.trim());
  const activeLines = lines.filter((l) => l !== '' && !l.startsWith('#'));

  if (activeLines.length === 0) {
    return [
      error('robots-empty', 'robots.txt has no directives.', {
        file: 'public/robots.txt',
      }),
    ];
  }

  let hasUserAgent = false;
  let hasSitemap = false;
  let disallowAll = false;

  for (const line of activeLines) {
    const colon = line.indexOf(':');
    if (colon === -1) {
      violations.push(
        warning(
          'robots-malformed-line',
          `Line is not in "directive: value" format: "${line}"`,
          { file: 'public/robots.txt' },
        ),
      );
      continue;
    }
    const directive = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();

    if (!VALID_DIRECTIVES.has(directive)) {
      violations.push(
        warning(
          'robots-unknown-directive',
          `Unknown directive "${directive}".`,
          { file: 'public/robots.txt' },
        ),
      );
    }

    if (directive === 'user-agent') hasUserAgent = true;
    if (directive === 'sitemap') hasSitemap = true;
    if (directive === 'disallow' && value === '/') disallowAll = true;
  }

  if (!hasUserAgent) {
    violations.push(
      error('robots-no-user-agent', 'robots.txt has no User-agent directive.', {
        file: 'public/robots.txt',
      }),
    );
  }

  if (!hasSitemap) {
    violations.push(
      warning(
        'robots-no-sitemap',
        'robots.txt does not reference a Sitemap.',
        { file: 'public/robots.txt' },
      ),
    );
  }

  if (disallowAll) {
    violations.push(
      error(
        'robots-disallow-all',
        'robots.txt disallows the entire site (Disallow: /).',
        {
          file: 'public/robots.txt',
          hint: 'This blocks all search engines. Remove unless intentional.',
        },
      ),
    );
  }

  const siteUrl = getSiteUrl();
  if (siteUrl && hasSitemap) {
    const sitemapLine = activeLines.find((l) => l.toLowerCase().startsWith('sitemap:'));
    if (sitemapLine) {
      const sitemapUrl = sitemapLine.slice(sitemapLine.indexOf(':') + 1).trim();
      if (!sitemapUrl.startsWith(siteUrl)) {
        violations.push(
          warning(
            'robots-sitemap-mismatch',
            `Sitemap URL does not match VITE_SITE_URL.`,
            {
              file: 'public/robots.txt',
              hint: `Expected prefix: ${siteUrl}`,
            },
          ),
        );
      }
    }
  }

  return violations;
}
