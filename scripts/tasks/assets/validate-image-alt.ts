/**
 * Image alt text validator. Ensures every <img> has an alt attribute:
 *   - Decorative images: alt=""
 *   - Informative images: descriptive alt
 *   - Missing alt is a WCAG failure
 */

import { readText, walkFiles } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, info, type Violation } from '../../utils/validation-result';

const IMG_TAG_RE = /<img\b[^>]*>/g;

function lineNumberAt(source: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const files = await walkFiles(PATHS.src, { extensions: ['.tsx'] });

  for (const file of files) {
    const relPath = file
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');
    if (relPath.endsWith('.test.tsx')) continue;

    const src = await readText(file);
    IMG_TAG_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = IMG_TAG_RE.exec(src)) !== null) {
      const tag = m[0];
      const hasAlt = /\balt\s*=/.test(tag);
      const isSvg = /\.svg["']/.test(tag);

      if (!hasAlt && !isSvg) {
        violations.push(
          error('img-missing-alt', '<img> tag missing alt attribute.', {
            file: relPath,
            line: lineNumberAt(src, m.index),
            hint: 'Add alt="" for decorative, or a descriptive alt for informative images.',
          }),
        );
      }
      if (m.index === IMG_TAG_RE.lastIndex) IMG_TAG_RE.lastIndex += 1;
    }
  }

  if (violations.length === 0) {
    violations.push(info('image-alt-ok', 'All <img> tags have alt attributes.'));
  }

  return violations;
}
