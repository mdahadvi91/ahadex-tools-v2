/**
 * Content inventory validator. Ensures every live tool has an
 * inventory record so growth tracking is complete.
 *
 * Currently reads manifests and verifies:
 *   - Each live tool has content (content.ts)
 *   - Content word count above minimum
 *   - Content has FAQ, references, internal links
 */

import { join } from 'node:path';
import { walkFiles, readText, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { info, warning, type Violation } from '../../utils/validation-result';

function countWords(src: string): number {
  const literals = [...src.matchAll(/['"`]([^'"`]{20,})['"`]/g)].map((m) => m[1]);
  return literals.join(' ').split(/\s+/).filter((w) => w.length > 0).length;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  if (!(await pathExists(PATHS.srcTools))) return violations;

  const indexFiles = (await walkFiles(PATHS.srcTools, { extensions: ['.ts'] })).filter(
    (f) => f.endsWith('/index.ts') && !f.includes('/tests/'),
  );

  for (const indexFile of indexFiles) {
    const match = indexFile.match(/tools\/([^/]+)\/index\.ts$/);
    if (!match) continue;
    const slug = match[1];

    const contentPath = join(PATHS.srcTools, slug, 'content.ts');
    if (!(await pathExists(contentPath))) {
      violations.push(
        warning(
          'inventory-no-content',
          `Tool "${slug}" has no content.ts for inventory tracking.`,
          { file: `src/tools/${slug}/content.ts` },
        ),
      );
      continue;
    }

    const src = await readText(contentPath);
    const wordCount = countWords(src);
    const hasFaq = /FAQ\s*[^=]*=\s*\[/.test(src);
    const hasReferences = /REFERENCES\s*[^=]*=\s*\[/.test(src);
    const hasInternalLinks = /INTERNAL_LINKS\s*[^=]*=\s*\[/.test(src);

    violations.push(
      info(
        'inventory-record',
        `Tool "${slug}": ${wordCount} words, FAQ=${hasFaq}, refs=${hasReferences}, links=${hasInternalLinks}`,
      ),
    );

    if (wordCount < 500) {
      violations.push(
        warning(
          'inventory-thin',
          `Tool "${slug}" has only ${wordCount} words in content.ts.`,
          { hint: 'Add more substantive content.' },
        ),
      );
    }
    if (!hasFaq) {
      violations.push(
        warning('inventory-no-faq', `Tool "${slug}" has no FAQ.`, {
          file: `src/tools/${slug}/content.ts`,
        }),
      );
    }
    if (!hasReferences) {
      violations.push(
        warning('inventory-no-refs', `Tool "${slug}" has no REFERENCES.`, {
          file: `src/tools/${slug}/content.ts`,
        }),
      );
    }
    if (!hasInternalLinks) {
      violations.push(
        warning('inventory-no-links', `Tool "${slug}" has no INTERNAL_LINKS.`, {
          file: `src/tools/${slug}/content.ts`,
        }),
      );
    }
  }

  return violations;
}
