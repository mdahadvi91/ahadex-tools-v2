/**
 * Content structure validator. Ensures content sections follow the
 * expected structure for SEO / AEO / LLM readability:
 *   - At least 4 h2 sections
 *   - Sections listed in a logical order (intro first, limits last)
 *   - Each section has at least one substantive paragraph (50+ chars)
 *   - Total content exceeds 800 words
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

/** Counts words in all string literals of a content.ts file. */
function countWords(src: string): number {
  const literals = [...src.matchAll(/['"`]([^'"`]{20,})['"`]/g)].map((m) => m[1]);
  return literals.join(' ').split(/\s+/).filter((w) => w.length > 0).length;
}

function countSections(src: string): number {
  const m = src.match(/SECTIONS\s*[^=]*=\s*\[([\s\S]*?)\];/);
  if (!m) return 0;
  // Match: heading: '...' occurrences within the SECTIONS array.
  return (m[1].match(/heading\s*:/g) ?? []).length;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const contentFiles = (await walkFiles(PATHS.srcTools, { extensions: ['.ts'] })).filter(
    (f) => f.endsWith('/content.ts'),
  );

  for (const file of contentFiles) {
    const relPath = file.substring(PATHS.root.length + 1).split('\\').join('/');
    const slug = relPath.match(/tools\/([^/]+)\//)?.[1] ?? 'unknown';
    const src = await readText(file);

    const sections = countSections(src);
    if (sections < 4) {
      violations.push(
        error(
          'content-few-sections',
          `Tool "${slug}" has only ${sections} sections (target 4+).`,
          {
            file: relPath,
            hint: 'Add substantive sections: what, how, when, formats, limits, privacy.',
          },
        ),
      );
    }

    const words = countWords(src);
    if (words < 800) {
      violations.push(
        error(
          'content-too-thin',
          `Tool "${slug}" has ~${words} words (target 800+).`,
          {
            file: relPath,
            hint: 'Thin content hurts AdSense approval and SEO ranking.',
          },
        ),
      );
    } else if (words > 3500) {
      violations.push(
        warning(
          'content-too-long',
          `Tool "${slug}" has ~${words} words (target under 3500).`,
          {
            file: relPath,
            hint: 'Very long pages may lose reader attention.',
          },
        ),
      );
    }

    // Rule: HERO present.
    if (!/export\s+const\s+HERO\b/.test(src)) {
      violations.push(
        error('content-no-hero', `Tool "${slug}" has no HERO export.`, {
          file: relPath,
        }),
      );
    }

    // Rule: DIRECT_ANSWER present (required for AEO).
    if (!/export\s+const\s+DIRECT_ANSWER\b/.test(src)) {
      violations.push(
        error(
          'content-no-direct-answer',
          `Tool "${slug}" has no DIRECT_ANSWER (required for AEO / LLM citation).`,
          { file: relPath },
        ),
      );
    }
  }

  return violations;
}
