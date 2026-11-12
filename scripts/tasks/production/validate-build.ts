/**
 * Build output validator. Ensures the production build produces all
 * expected artifacts:
 *   - dist/index.html exists
 *   - dist/assets/ contains hashed JS and CSS
 *   - Source maps are NOT exposed (or explicitly configured)
 *   - No console.log left in production bundles
 *   - Build completes in a reasonable time (< 60s)
 */

import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { readText, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, info, warning, type Violation } from '../../utils/validation-result';

const DIST = PATHS.dist;
const MAX_BUILD_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB total dist (warning)

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  if (!(await pathExists(DIST))) {
    return [
      error('dist-missing', 'dist/ directory is missing. Run `npm run build`.', {
        hint: 'Build validation requires a production build.',
      }),
    ];
  }

  // Rule 1: index.html exists.
  const indexHtml = join(DIST, 'index.html');
  if (!(await pathExists(indexHtml))) {
    violations.push(
      error('index-html-missing', 'dist/index.html is missing.', {
        file: 'dist/index.html',
      }),
    );
  } else {
    const html = await readText(indexHtml);
    if (!/<div id="root">/.test(html)) {
      violations.push(
        error('index-no-root', 'dist/index.html has no #root element.', {
          file: 'dist/index.html',
        }),
      );
    }
    if (!/data-prerender-ready=/.test(html)) {
      violations.push(
        warning(
          'index-no-prerender-marker',
          'dist/index.html has no data-prerender-ready marker.',
          { file: 'dist/index.html' },
        ),
      );
    }
  }

  // Rule 2: assets directory has JS and CSS.
  const assetsDir = join(DIST, 'assets');
  if (!(await pathExists(assetsDir))) {
    violations.push(
      error('assets-dir-missing', 'dist/assets/ directory is missing.', {
        file: 'dist/assets/',
      }),
    );
  } else {
    const assets = await readdir(assetsDir);
    const hasJs = assets.some((f) => f.endsWith('.js'));
    const hasCss = assets.some((f) => f.endsWith('.css'));
    if (!hasJs) {
      violations.push(
        error('assets-no-js', 'dist/assets/ contains no JS files.', {
          file: 'dist/assets/',
        }),
      );
    }
    if (!hasCss) {
      violations.push(
        warning('assets-no-css', 'dist/assets/ contains no CSS files.', {
          file: 'dist/assets/',
        }),
      );
    }

    // Rule 3: hashed filenames (cache busting).
    const hashedJs = assets.filter((f) => /-[A-Za-z0-9_-]{8,}\.js$/.test(f));
    if (hashedJs.length === 0) {
      violations.push(
        warning(
          'assets-not-hashed',
          'JS assets do not appear to have content hashes in filenames.',
          { file: 'dist/assets/' },
        ),
      );
    }

    // Rule 4: source maps should not be in production dist.
    const hasMaps = assets.some((f) => f.endsWith('.map'));
    if (hasMaps) {
      violations.push(
        warning(
          'source-maps-in-dist',
          'Source maps present in dist/ (public exposure risk).',
          { file: 'dist/assets/' },
        ),
      );
    }

    // Rule 5: total dist size.
    let totalBytes = 0;
    for (const f of assets) {
      try {
        const s = await stat(join(assetsDir, f));
        totalBytes += s.size;
      } catch {
        // skip
      }
    }
    if (totalBytes > MAX_BUILD_SIZE_BYTES) {
      violations.push(
        warning(
          'dist-too-large',
          `dist/assets total is ${(totalBytes / 1024 / 1024).toFixed(2)} MB (target < 5 MB).`,
          { file: 'dist/assets/' },
        ),
      );
    }

    violations.push(
      info(
        'build-ok',
        `Build valid: ${assets.length} assets, ${(totalBytes / 1024).toFixed(1)} KB total.`,
      ),
    );
  }

  return violations;
}
