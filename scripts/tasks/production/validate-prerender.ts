/**
 * Prerender validator. Ensures the SPA fallback works and prerender
 * marker is set correctly.
 *
 * Since the site is currently an SPA (no SSG yet), this validator
 * checks that:
 *   - dist/index.html has data-prerender-ready="false" (SPA mode)
 *   - _redirects exists with SPA fallback rule
 *   - When SSG POC succeeds, this validator will switch to checking
 *     individual route HTML files (see ADR-003).
 */

import { join } from 'node:path';
import { readText, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, info, type Violation } from '../../utils/validation-result';

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  // Rule 1: dist/index.html exists and has prerender marker.
  const indexPath = join(PATHS.dist, 'index.html');
  if (!(await pathExists(indexPath))) {
    return [
      error('prerender-no-dist', 'dist/index.html is missing.', {
        file: 'dist/index.html',
        hint: 'Run `npm run build` first.',
      }),
    ];
  }

  const html = await readText(indexPath);
  if (!/data-prerender-ready=["'](?:true|false)["']/.test(html)) {
    violations.push(
      warning(
        'prerender-marker-missing',
        'dist/index.html is missing data-prerender-ready attribute.',
        {
          file: 'dist/index.html',
          hint: 'Add data-prerender-ready="false" to <html> in index.html.',
        },
      ),
    );
  }

  // Rule 2: _redirects file exists with SPA fallback.
  const redirectsPath = join(PATHS.public, '_redirects');
  if (!(await pathExists(redirectsPath))) {
    violations.push(
      error(
        'redirects-missing',
        'public/_redirects is missing (SPA fallback may not work).',
        { file: 'public/_redirects' },
      ),
    );
  } else {
    const redirects = await readText(redirectsPath);
    // SPA fallback: any path → index.html 200
    if (!/\/\*\s+\/index\.html\s+200/.test(redirects) && !/\/tools\/\*\s+\/index\.html\s+200/.test(redirects)) {
      violations.push(
        warning(
          'redirects-no-spa-fallback',
          'public/_redirects has no catch-all SPA fallback.',
          {
            file: 'public/_redirects',
            hint: 'Add: /* /index.html 200 for SPA routing.',
          },
        ),
      );
    }
  }

  // Rule 3: check for prerendered HTML files (only if SSG is active).
  // Currently SSG is deferred. This rule activates after POC.
  const prerenderActive = html.includes('data-prerender-ready="true"');
  if (prerenderActive) {
    // Check for prerendered tool routes.
    const imageCompressorPath = join(PATHS.dist, 'tools/image-compressor/index.html');
    if (!(await pathExists(imageCompressorPath))) {
      violations.push(
        error(
          'prerender-tool-missing',
          'data-prerender-ready="true" but dist/tools/image-compressor/index.html missing.',
          {
            file: 'dist/tools/image-compressor/index.html',
            hint: 'SSG must generate tool route HTML files.',
          },
        ),
      );
    }
  } else {
    violations.push(
      info(
        'prerender-spa-mode',
        'SPA mode active (data-prerender-ready="false"). SSG POC pending.',
      ),
    );
  }

  return violations;
}
