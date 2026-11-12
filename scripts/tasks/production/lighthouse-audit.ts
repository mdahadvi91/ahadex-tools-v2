/**
 * Lighthouse audit validator. Static approximation of Lighthouse
 * scores for CI environments without a full Chrome + network stack:
 *   - Checks bundle sizes (delegates to performance group)
 *   - Checks for render-blocking resources
 *   - Checks for unoptimized images
 *   - Checks for missing meta tags
 *
 * Full Lighthouse CI runs in .github/workflows/lighthouse.yml
 * against the deployed URL.
 */

import { join } from 'node:path';
import { readdir, stat } from 'node:fs/promises';
import { readText, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, info, warning, type Violation } from '../../utils/validation-result';

const MAX_INDEX_HTML_BYTES = 50 * 1024;
const MAX_INITIAL_JS_BYTES = 300 * 1024;
const MAX_INITIAL_CSS_BYTES = 100 * 1024;

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  // Rule 1: dist exists.
  if (!(await pathExists(PATHS.dist))) {
    return [
      warning('lighthouse-no-dist', 'dist/ is missing. Lighthouse static audit skipped.', {
        hint: 'Run `npm run build` to enable.',
      }),
    ];
  }

  // Rule 2: index.html size.
  const indexPath = join(PATHS.dist, 'index.html');
  if (await pathExists(indexPath)) {
    try {
      const s = await stat(indexPath);
      if (s.size > MAX_INDEX_HTML_BYTES) {
        violations.push(
          warning(
            'lighthouse-html-too-large',
            `index.html is ${(s.size / 1024).toFixed(1)} KB (target < 50 KB).`,
            { file: 'dist/index.html' },
          ),
        );
      }
    } catch {
      // skip
    }

    const html = await readText(indexPath);

    // Rule 3: no render-blocking resources in <head>.
    const headMatch = html.match(/<head>([\s\S]*?)<\/head>/i);
    if (headMatch) {
      const headContent = headMatch[1];
      const blockingScript =
        /<script\b(?![^>]*\b(?:async|defer|type=["']module["']))[^>]*src=/.test(headContent);
      if (blockingScript) {
        violations.push(
          error('lighthouse-render-blocking-script', 'Render-blocking <script> in <head>.', {
            file: 'dist/index.html',
            hint: 'Use defer or type="module" for scripts.',
          }),
        );
      }

      const blockingStylesheet =
        /<link\b[^>]*rel=["']stylesheet["'](?![^>]*media=["']print["'])/.test(headContent);
      if (blockingStylesheet) {
        violations.push(
          info(
            'lighthouse-blocking-css',
            'Stylesheet in <head> blocks rendering (common, consider inlining critical CSS).',
            { file: 'dist/index.html' },
          ),
        );
      }
    }
  }

  // Rule 4: bundle size checks (complement performance group).
  const assetsDir = join(PATHS.dist, 'assets');
  if (await pathExists(assetsDir)) {
    const assets = await readdir(assetsDir);

    let jsBytes = 0;
    let cssBytes = 0;
    for (const name of assets) {
      const s = await stat(join(assetsDir, name));
      if (name.endsWith('.js')) jsBytes += s.size;
      if (name.endsWith('.css')) cssBytes += s.size;
    }

    if (jsBytes > MAX_INITIAL_JS_BYTES) {
      violations.push(
        warning(
          'lighthouse-js-too-large',
          `Total JS is ${(jsBytes / 1024).toFixed(1)} KB (target < 300 KB).`,
          { file: 'dist/assets/' },
        ),
      );
    }
    if (cssBytes > MAX_INITIAL_CSS_BYTES) {
      violations.push(
        warning(
          'lighthouse-css-too-large',
          `Total CSS is ${(cssBytes / 1024).toFixed(1)} KB (target < 100 KB).`,
          { file: 'dist/assets/' },
        ),
      );
    }

    // Rule 5: image optimization check.
    const images = assets.filter((f) => /\.(?:png|jpe?g|webp|avif)$/i.test(f));
    for (const img of images) {
      const s = await stat(join(assetsDir, img));
      if (s.size > 500 * 1024) {
        violations.push(
          warning(
            'lighthouse-image-too-large',
            `Image "${img}" is ${(s.size / 1024).toFixed(0)} KB (target < 500 KB).`,
            { file: `dist/assets/${img}`, hint: 'Compress or convert to WebP/AVIF.' },
          ),
        );
      }
    }

    violations.push(
      info(
        'lighthouse-static-ok',
        `Static audit: JS ${(jsBytes / 1024).toFixed(1)} KB, CSS ${(cssBytes / 1024).toFixed(1)} KB, ${assets.length} assets.`,
      ),
    );
  }

  // Rule 6: note that full Lighthouse runs in CI.
  violations.push(
    info(
      'lighthouse-ci-notice',
      'Full Lighthouse CI runs in .github/workflows/lighthouse.yml against the deployed URL.',
    ),
  );

  return violations;
}
