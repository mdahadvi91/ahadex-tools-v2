/**
 * Link targets validator. Ensures every internal link target is a
 * valid route or a section anchor.
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { discoverTools } from '../../utils/route-discovery';
import { error, warning, type Violation } from '../../utils/validation-result';

const STATIC_PATHS = new Set([
  '/',
  '/tools',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/disclaimer',
  '/cookies',
]);

function lineNumberAt(source: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const { tools } = await discoverTools();
  const toolPaths = new Set(tools.map((t) => t.manifest.path));
  const validPaths = new Set([...STATIC_PATHS, ...toolPaths]);

  const contentFiles = (await walkFiles(PATHS.srcTools, { extensions: ['.ts'] })).filter((f) =>
    f.endsWith('/content.ts'),
  );

  for (const file of contentFiles) {
    const relPath = file
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');
    const src = await readText(file);

    // Match path: '/path' in INTERNAL_LINKS-like arrays
    const pathRe = /path\s*:\s*['"`](\/[^'"`]*)['"`]/g;
    let m: RegExpExecArray | null;
    while ((m = pathRe.exec(src)) !== null) {
      const path = m[1].split('#')[0].split('?')[0];
      if (!validPaths.has(path)) {
        violations.push(
          error('invalid-link-target', `Link target "${m[1]}" is not a valid route.`, {
            file: relPath,
            line: lineNumberAt(src, m.index),
          }),
        );
      }
    }

    // Also check to: '/path' in JSX (if present in .ts content)
    const toRe = /\bto\s*:\s*['"`](\/[^'"`]*)['"`]/g;
    while ((m = toRe.exec(src)) !== null) {
      const path = m[1].split('#')[0].split('?')[0];
      if (!validPaths.has(path)) {
        violations.push(
          warning('invalid-to-target', `Link target "${m[1]}" is not a valid route.`, {
            file: relPath,
            line: lineNumberAt(src, m.index),
          }),
        );
      }
    }
  }

  return violations;
}
