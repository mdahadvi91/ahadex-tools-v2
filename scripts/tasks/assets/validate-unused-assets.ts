/**
 * Unused assets validator. Finds files in public/ that are never
 * referenced in source code or HTML. Warns (does not error) because
 * some assets may be referenced externally (sitemaps, ads.txt).
 */

import { readText, walkFiles, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { info, warning, type Violation } from '../../utils/validation-result';

/** Files exempt from unused check. */
const EXEMPT = new Set([
  'robots.txt',
  'sitemap.xml',
  'ads.txt',
  '_headers',
  '_redirects',
  'site.webmanifest',
  'favicon.ico',
  'favicon.svg',
  'index.html',
]);

const REFERENCE_EXTS = ['.ts', '.tsx', '.html', '.css', '.md', '.json'];

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  if (!(await pathExists(PATHS.public))) return violations;

  // Collect all public files.
  const publicFiles = await walkFiles(PATHS.public, {
    extensions: [
      '.png',
      '.jpg',
      '.jpeg',
      '.webp',
      '.avif',
      '.gif',
      '.svg',
      '.ico',
      '.woff',
      '.woff2',
      '.ttf',
      '.otf',
    ],
  });

  if (publicFiles.length === 0) return violations;

  // Build a big corpus of all source text.
  const sourceFiles = await walkFiles(PATHS.root, {
    extensions: REFERENCE_EXTS,
    skipDirs: ['node_modules', '.git', 'dist', 'coverage', '.vite', 'reports', 'public'],
  });

  let corpus = '';
  for (const file of sourceFiles) {
    try {
      corpus += (await readText(file)) + '\n';
    } catch {
      // skip
    }
  }
  // Also include HTML in root.
  for (const htmlExt of ['.html']) {
    const htmlFiles = await walkFiles(PATHS.root, {
      extensions: [htmlExt],
      skipDirs: ['node_modules', '.git', 'dist', '.vite'],
      maxDepth: 1,
    });
    for (const f of htmlFiles) {
      try {
        corpus += (await readText(f)) + '\n';
      } catch {
        // skip
      }
    }
  }

  for (const file of publicFiles) {
    const relPath = file
      .substring(PATHS.public.length + 1)
      .split('\\')
      .join('/');
    const basename = relPath.split('/').pop() ?? '';

    if (EXEMPT.has(relPath) || EXEMPT.has(basename)) continue;

    // Check if the file is referenced by path or basename.
    const pathRef = `/${relPath}`;
    const basenameRef = `/${basename}`;
    const isReferenced =
      corpus.includes(pathRef) || corpus.includes(basenameRef) || corpus.includes(`"${basename}"`);

    if (!isReferenced) {
      violations.push(
        warning('unused-asset', `Asset "${relPath}" is not referenced anywhere.`, {
          file: `public/${relPath}`,
          hint: 'Remove if unused, or reference it in code/HTML.',
        }),
      );
    }
  }

  if (violations.length === 0) {
    violations.push(info('unused-assets-ok', `All ${publicFiles.length} assets are referenced.`));
  }

  return violations;
}
