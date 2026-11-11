/**
 * Content files validator. Ensures every tool has the required
 * content files and they export the expected shapes:
 *   - content.ts exports HERO, SECTIONS, FAQ
 *   - FAQ.tsx exists
 *   - Content.tsx exists
 *   - Hero.tsx exists
 *   - Page.tsx composes them
 */

import { walkFiles, readText, pathExists } from '../../utils/file-system';
import { join } from 'node:path';
import { PATHS } from '../../utils/constants';
import { error, type Violation } from '../../utils/validation-result';

const REQUIRED_FILES = ['content.ts', 'FAQ.tsx', 'Content.tsx', 'Hero.tsx', 'Page.tsx'];
const REQUIRED_EXPORTS = ['HERO', 'SECTIONS', 'FAQ'];

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  if (!(await pathExists(PATHS.srcTools))) return violations;

  // Find tool directories that have an index.ts.
  const indexFiles = (await walkFiles(PATHS.srcTools, { extensions: ['.ts'] })).filter(
    (f) => f.endsWith('/index.ts') && !f.includes('/tests/'),
  );

  const toolDirs = new Set<string>();
  for (const f of indexFiles) {
    const m = f.match(/tools\/([^/]+)\/index\.ts$/);
    if (m) toolDirs.add(m[1]);
  }

  for (const slug of toolDirs) {
    const toolDir = join(PATHS.srcTools, slug);

    // Rule 1: required files exist.
    for (const filename of REQUIRED_FILES) {
      const full = join(toolDir, filename);
      if (!(await pathExists(full))) {
        violations.push(
          error(
            'content-file-missing',
            `Tool "${slug}" is missing required content file: ${filename}`,
            {
              file: `src/tools/${slug}/${filename}`,
            },
          ),
        );
      }
    }

    // Rule 2: content.ts exports the required constants.
    const contentPath = join(toolDir, 'content.ts');
    if (await pathExists(contentPath)) {
      const src = await readText(contentPath);
      for (const name of REQUIRED_EXPORTS) {
        const pattern = new RegExp(`export\\s+const\\s+${name}\\b`);
        if (!pattern.test(src)) {
          violations.push(
            error(
              'content-export-missing',
              `Tool "${slug}" content.ts does not export "${name}".`,
              { file: `src/tools/${slug}/content.ts` },
            ),
          );
        }
      }
    }
  }

  return violations;
}
