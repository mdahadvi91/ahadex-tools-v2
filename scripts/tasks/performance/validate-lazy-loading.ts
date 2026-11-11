/**
 * Lazy loading validator. Ensures images and heavy routes are lazy:
 *   - Every <img> below the fold has loading="lazy"
 *   - Heavy routes use React.lazy
 *   - No sync import of large tools from page files
 *   - No large JS bundles loaded eagerly on initial route
 */

import { readText, walkFiles, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

function lineNumberAt(src: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < src.length; i++) {
    if (src.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

/** Files exempt from lazy img checks (above-the-fold logos, etc.). */
const EAGER_IMG_ALLOW = new Set([
  'src/components/Header.tsx',
  'src/components/Footer.tsx',
]);

/** Tags below fold. Anything matching is expected to be lazy. */
const IMG_RE = /<img\b[^>]*>/g;

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const files = await walkFiles(PATHS.src, { extensions: ['.tsx'] });
  for (const file of files) {
    const relPath = file.replace(PATHS.root + '/', '').split('\\').join('/');
    if (relPath.endsWith('.test.tsx')) continue;

    const src = await readText(file);

    // Rule 1: <img> tags must have loading="lazy" unless allowed.
    if (!EAGER_IMG_ALLOW.has(relPath)) {
      let m: RegExpExecArray | null;
      IMG_RE.lastIndex = 0;
      while ((m = IMG_RE.exec(src)) !== null) {
        const tag = m[0];
        const hasLazy = /loading\s*=\s*["']lazy["']/.test(tag);
        const hasEager = /loading\s*=\s*["']eager["']/.test(tag);
        const isSvg = /\.svg["']/.test(tag);
        if (!hasLazy && !hasEager && !isSvg) {
          violations.push(
            warning(
              'img-not-lazy',
              '<img> without loading="lazy". Confirm it is above the fold.',
              {
                file: relPath,
                line: lineNumberAt(src, m.index),
                hint: 'Add loading="lazy" for below-the-fold images.',
              },
            ),
          );
        }
        if (m.index === IMG_RE.lastIndex) IMG_RE.lastIndex += 1;
      }
    }

    // Rule 2: pages must not statically import tool Page components.
    if (relPath.startsWith('src/pages/')) {
      const importRe = /import\s+(\w+)\s+from\s+['"][^'"]*\/tools\/[^'"]+['"]/g;
      let m: RegExpExecArray | null;
      while ((m = importRe.exec(src)) !== null) {
        violations.push(
          error(
            'page-static-tool-import',
            `Page statically imports tool component "${m[1]}".`,
            {
              file: relPath,
              line: lineNumberAt(src, m.index),
              hint: 'Use React.lazy for tool pages to split bundles.',
            },
          ),
        );
      }
    }

    // Rule 3: routes.tsx should use lazy() for tool pages.
    if (relPath === 'src/router/routes.tsx') {
      if (!/lazy\(|React\.lazy|useRoutes/.test(src)) {
        violations.push(
          warning(
            'routes-no-lazy',
            'routes.tsx does not use lazy loading for tool routes.',
            { file: 'src/router/routes.tsx' },
          ),
        );
      }
    }
  }

  // Rule 4: no sync import of large PDF libraries from pages.
  const pdfLibs = ['pdf-lib', 'pdfjs-dist'];
  for (const file of files) {
    const relPath = file.replace(PATHS.root + '/', '').split('\\').join('/');
    if (!relPath.startsWith('src/pages/')) continue;
    const src = await readText(file);
    for (const lib of pdfLibs) {
      if (new RegExp(`from\\s+['"]${lib}['"]`).test(src)) {
        violations.push(
          error(
            'page-sync-pdf-lib',
            `Page imports heavy "${lib}" synchronously.`,
            {
              file: relPath,
              hint: 'Move PDF processing into a tool engine (worker) and import lazily.',
            },
          ),
        );
      }
    }
  }

  // Rule 5: engine worker files must be loaded via ?worker import
  // (not statically pulled into main bundle).
  if (await pathExists(PATHS.srcTools)) {
    const engineFiles = await walkFiles(PATHS.srcTools, {
      extensions: ['.ts', '.tsx'],
    });
    for (const file of engineFiles) {
      const relPath = file.replace(PATHS.root + '/', '').split('\\').join('/');
      if (!relPath.includes('/engine/') || !relPath.endsWith('worker.ts')) continue;
      const src = await readText(file);
      if (!/self\.onmessage|addEventListener\(['"]message/.test(src)) {
        violations.push(
          warning(
            'worker-no-handler',
            'Worker file does not register a message handler.',
            { file: relPath },
          ),
        );
      }
    }
  }

  return violations;
}
