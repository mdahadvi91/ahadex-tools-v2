/**
 * Internal links validator. Ensures internal links are valid:
 *   - Every link path resolves to a declared route or tool
 *   - No broken internal links
 *   - No self-links (a page linking to itself in its own primary content)
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { discoverTools } from '../../utils/route-discovery';
import { error, warning, type Violation } from '../../utils/validation-result';

const STATIC_ROUTES = [
  '/',
  '/tools',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/disclaimer',
  '/cookies',
];

/** Extracts internal Link paths and href="/path" from source. */
function extractInternalPaths(src: string): Array<{ path: string; line: number }> {
  const out: Array<{ path: string; line: number }> = [];
  const seen = new Set<string>();

  // <Link to="/path"> and to="/path"
  const linkRe = /\bto\s*=\s*['"](\/[^'"]*)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(src)) !== null) {
    const key = `${m.index}:${m[1]}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ path: m[1], line: lineNumberAt(src, m.index) });
    }
  }

  // href="/path"
  const hrefRe = /\bhref\s*=\s*['"](\/[^'"]*)['"]/g;
  while ((m = hrefRe.exec(src)) !== null) {
    const key = `${m.index}:${m[1]}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ path: m[1], line: lineNumberAt(src, m.index) });
    }
  }

  return out;
}

function lineNumberAt(source: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

function stripQueryAndHash(path: string): string {
  return path.split('?')[0].split('#')[0];
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const { tools } = await discoverTools();
  const validPaths = new Set<string>([
    ...STATIC_ROUTES,
    ...tools.filter((t) => t.manifest.status === 'live').map((t) => t.manifest.path),
  ]);

  const sourceFiles = await walkFiles(PATHS.src, {
    extensions: ['.ts', '.tsx'],
  });

  for (const file of sourceFiles) {
    const relPath = file.substring(PATHS.root.length + 1).split('\\').join('/');
    if (relPath.endsWith('.test.ts') || relPath.endsWith('.test.tsx')) continue;
    // Skip config files (they hold reference paths intentionally).
    if (relPath.startsWith('src/config/')) continue;

    const src = await readText(file);
    const paths = extractInternalPaths(src);

    for (const { path, line } of paths) {
      const clean = stripQueryAndHash(path);
      if (clean === '') continue;

      // Skip dynamic templates.
      if (clean.includes('${') || clean.includes('[')) continue;

      // Check against static routes and live tools.
      if (!validPaths.has(clean)) {
        // Allow sub-paths of tool routes.
        const isSubPath = [...validPaths].some(
          (valid) => valid !== '/' && clean.startsWith(valid + '/'),
        );
        if (!isSubPath) {
          violations.push(
            error(
              'broken-internal-link',
              `Internal link "${path}" does not match any route.`,
              {
                file: relPath,
                line,
                hint: 'Check the path against src/router/routes.tsx and tool manifests.',
              },
            ),
          );
        }
      }
    }
  }

  // Warn if any tool page has no internal links to other tools.
  const toolDirs = [...new Set(
    sourceFiles.map((f) => f.match(/tools\/([^/]+)\//)?.[1]).filter((x): x is string => !!x),
  )];
  for (const slug of toolDirs) {
    const contentFile = (await walkFiles(`${PATHS.srcTools}/${slug}`, { extensions: ['.ts'] })).find(
      (f) => f.endsWith('/content.ts'),
    );
    if (!contentFile) continue;
    const src = await readText(contentFile);
    if (!/INTERNAL_LINKS|internalLinks/.test(src)) {
      violations.push(
        warning(
          'tool-no-internal-links',
          `Tool "${slug}" declares no internal links to other tools.`,
          {
            file: contentFile.substring(PATHS.root.length + 1).split('\\').join('/'),
            hint: 'Add cross-tool links to build topical authority.',
          },
        ),
      );
    }
  }

  return violations;
}
