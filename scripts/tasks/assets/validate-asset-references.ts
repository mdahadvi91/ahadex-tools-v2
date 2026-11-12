/**
 * Asset reference validator. Ensures every path like '/images/...'
 * or '/favicon.ico' in source code points to a file that exists in
 * public/.
 */

import { join } from 'node:path';
import { readText, walkFiles, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, info, type Violation } from '../../utils/validation-result';

/** Match string literals starting with / and ending in an asset extension. */
const ASSET_REF_RE =
  /['"](\/[^'"\s]+\.(?:png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|otf|json|txt|xml|webmanifest|css))['"]/g;

function lineNumberAt(source: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

async function resolveAsset(publicPath: string): Promise<string | null> {
  const rel = publicPath.replace(/^\/+/, '');
  const candidate = join(PATHS.public, rel);
  if (await pathExists(candidate)) return candidate;
  return null;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const files = await walkFiles(PATHS.src, {
    extensions: ['.ts', '.tsx'],
  });

  for (const file of files) {
    const relPath = file
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');
    if (relPath.endsWith('.test.ts') || relPath.endsWith('.test.tsx')) continue;

    const src = await readText(file);
    ASSET_REF_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = ASSET_REF_RE.exec(src)) !== null) {
      const ref = m[1];

      // Skip API routes and dynamic paths.
      if (ref.includes('${') || ref.includes('[')) continue;

      const resolved = await resolveAsset(ref);
      if (!resolved) {
        violations.push(
          error('asset-not-found', `Asset reference "${ref}" not found in public/.`, {
            file: relPath,
            line: lineNumberAt(src, m.index),
            hint: 'Create the file or fix the path.',
          }),
        );
      }
      if (m.index === ASSET_REF_RE.lastIndex) ASSET_REF_RE.lastIndex += 1;
    }
  }

  // Also check index.html for references.
  const htmlFiles = await walkFiles(PATHS.root, { extensions: ['.html'] });
  for (const file of htmlFiles) {
    const relPath = file
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');
    if (!relPath.includes('.')) continue;
    const src = await readText(file);
    const hrefRe = /(?:href|src)="(\/[^"]+\.(?:png|jpe?g|webp|svg|ico|webmanifest|xml|txt))"/g;
    let m: RegExpExecArray | null;
    while ((m = hrefRe.exec(src)) !== null) {
      const ref = m[1];
      if (ref.includes('${')) continue;
      const resolved = await resolveAsset(ref);
      if (!resolved) {
        violations.push(
          error('html-asset-not-found', `Asset "${ref}" referenced in HTML not found in public/.`, {
            file: relPath,
            line: lineNumberAt(src, m.index),
          }),
        );
      }
    }
  }

  if (violations.length === 0) {
    violations.push(info('asset-references-ok', 'All asset references resolve.'));
  }

  return violations;
}
