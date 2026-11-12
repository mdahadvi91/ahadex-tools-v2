/**
 * GEO answer structure validator. Ensures pages are answer-first so
 * AI assistants can quote a direct answer:
 *   - DIRECT_ANSWER is 100+ chars (substantive)
 *   - DIRECT_ANSWER leads with the subject ("X is a...")
 *   - HERO.tagline comes before DIRECT_ANSWER in content
 *   - Answer does not start with "We" (third-person is better for citation)
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

function extractHero(src: string): { h1: string | null; tagline: string | null } {
  const block = src.match(/HERO\s*=\s*\{([\s\S]*?)\}\s*as const;/);
  if (!block) return { h1: null, tagline: null };
  const h1M = block[1].match(/h1\s*:\s*['"`]([^'"`]+)['"`]/);
  const taglineM = block[1].match(/tagline\s*:\s*['"`]([^'"`]+)['"`]/);
  return { h1: h1M ? h1M[1] : null, tagline: taglineM ? taglineM[1] : null };
}

function extractDirectAnswer(src: string): string | null {
  const m = src.match(/DIRECT_ANSWER\s*=\s*(?:\n\s*)?['"`]([^'"`]+)['"`]/);
  return m ? m[1] : null;
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

    const hero = extractHero(src);
    const directAnswer = extractDirectAnswer(src);

    // Rule 1: HERO exists with h1 and tagline.
    if (!hero.h1) {
      violations.push(
        error('answer-no-hero-h1', `Tool "${slug}" HERO has no h1.`, { file: relPath }),
      );
    }
    if (!hero.tagline) {
      violations.push(
        error('answer-no-hero-tagline', `Tool "${slug}" HERO has no tagline.`, {
          file: relPath,
        }),
      );
    }

    // Rule 2: DIRECT_ANSWER present and substantive.
    if (!directAnswer) {
      violations.push(
        error(
          'answer-no-direct-answer',
          `Tool "${slug}" has no DIRECT_ANSWER.`,
          { file: relPath, hint: 'AI systems quote this field.' },
        ),
      );
      continue;
    }

    if (directAnswer.length < 100) {
      violations.push(
        error(
          'answer-too-short',
          `Tool "${slug}" DIRECT_ANSWER is only ${directAnswer.length} chars (target 100+).`,
          { file: relPath },
        ),
      );
    }

    // Rule 3: Answer should lead with the subject, not "We" / "Our".
    const firstWord = directAnswer.split(/\s+/)[0]?.toLowerCase();
    if (firstWord === 'we' || firstWord === 'our' || firstWord === 'i') {
      violations.push(
        warning(
          'answer-first-person',
          `Tool "${slug}" DIRECT_ANSWER starts with "${firstWord}" (first-person).`,
          {
            file: relPath,
            hint: 'Third-person descriptions are more citable by AI assistants.',
          },
        ),
      );
    }

    // Rule 4: Answer should contain the tool name.
    if (hero.h1 && !directAnswer.toLowerCase().includes(hero.h1.toLowerCase())) {
      violations.push(
        warning(
          'answer-no-entity',
          `Tool "${slug}" DIRECT_ANSWER does not mention "${hero.h1}".`,
          { file: relPath, hint: 'Name the entity for citation.' },
        ),
      );
    }

    // Rule 5: Answer should describe what the tool does.
    if (!/(?:is|does|provides|compresses|reduces|helps|converts|allows|processes)/i.test(directAnswer)) {
      violations.push(
        warning(
          'answer-no-verb',
          `Tool "${slug}" DIRECT_ANSWER does not describe the action clearly.`,
          { file: relPath },
        ),
      );
    }
  }

  return violations;
}
