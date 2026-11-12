/**
 * SEO config validator. Ensures the site-wide SEO foundation exists:
 *   - site.webmanifest with name, icons, start_url
 *   - robots.txt with User-agent and Sitemap directive
 *   - sitemap.xml exists (generated)
 *   - canonical domain configured via VITE_SITE_URL
 */

import { join } from 'node:path';
import { readText, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

interface WebManifest {
  name?: string;
  short_name?: string;
  start_url?: string;
  display?: string;
  icons?: Array<{ src: string; sizes: string; type: string }>;
  theme_color?: string;
  background_color?: string;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  // Rule 1: web manifest exists and is valid.
  const manifestPath = join(PATHS.public, 'site.webmanifest');
  if (!(await pathExists(manifestPath))) {
    violations.push(
      error('webmanifest-missing', 'public/site.webmanifest is missing.', {
        file: 'public/site.webmanifest',
      }),
    );
  } else {
    try {
      const manifest = JSON.parse(await readText(manifestPath)) as WebManifest;
      if (!manifest.name) {
        violations.push(
          error('webmanifest-no-name', 'site.webmanifest must have a "name".', {
            file: 'public/site.webmanifest',
          }),
        );
      }
      if (!manifest.short_name) {
        violations.push(
          warning('webmanifest-no-short-name', 'site.webmanifest should have a "short_name".', {
            file: 'public/site.webmanifest',
          }),
        );
      }
      if (!manifest.start_url) {
        violations.push(
          error('webmanifest-no-start-url', 'site.webmanifest must have "start_url".', {
            file: 'public/site.webmanifest',
          }),
        );
      }
      if (!manifest.icons || manifest.icons.length === 0) {
        violations.push(
          error('webmanifest-no-icons', 'site.webmanifest must declare at least one icon.', {
            file: 'public/site.webmanifest',
          }),
        );
      }
    } catch (err) {
      violations.push(
        error(
          'webmanifest-invalid-json',
          `site.webmanifest is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
          { file: 'public/site.webmanifest' },
        ),
      );
    }
  }

  // Rule 2: robots.txt exists with User-agent and Sitemap.
  if (!(await pathExists(PATHS.publicRobots))) {
    violations.push(
      error('robots-missing', 'public/robots.txt is missing.', {
        file: 'public/robots.txt',
      }),
    );
  } else {
    const robots = await readText(PATHS.publicRobots);
    if (!/user-agent:/i.test(robots)) {
      violations.push(
        error('robots-no-user-agent', 'robots.txt must declare a User-agent.', {
          file: 'public/robots.txt',
        }),
      );
    }
    if (!/sitemap:/i.test(robots)) {
      violations.push(
        warning('robots-no-sitemap', 'robots.txt should reference a Sitemap.', {
          file: 'public/robots.txt',
        }),
      );
    }
  }

  // Rule 3: sitemap exists (generated).
  if (!(await pathExists(PATHS.publicSitemap))) {
    violations.push(
      error('sitemap-missing', 'public/sitemap.xml is missing.', {
        file: 'public/sitemap.xml',
        hint: 'Run `npm run generate:sitemap` or `npm run build`.',
      }),
    );
  }

  // Rule 4: VITE_SITE_URL configured.
  if (!process.env.VITE_SITE_URL) {
    violations.push(
      warning(
        'site-url-not-set',
        'VITE_SITE_URL is not set. Canonical, sitemap and OG URLs cannot be verified.',
        { hint: 'Set VITE_SITE_URL in .env or CI environment.' },
      ),
    );
  }

  return violations;
}
