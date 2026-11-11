/**
 * FAQ content validator. Ensures FAQ entries are useful and not
 * auto-generated filler:
 *   - At least 5 FAQ items per tool
 *   - No duplicate questions
 *   - Questions end with "?"
 *   - Answers are 40+ chars (substantive, not one-word)
 *   - Answers do not start with "Yes" or "No" alone
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

interface FAQPair {
  question: string;
  answer: string;
}

/** Extracts FAQ array from content.ts. */
function extractFAQ(src: string): FAQPair[] {
  const m = src.match(/FAQ\s*[^=]*=\s*\[([\s\S]*?)\];/);
  if (!m) return [];

  const body = m[1];
  const pairs: FAQPair[] = [];
  // Match each `{ question: '...', answer: '...' }` block.
  const re = /\{\s*question\s*:\s*['"`]([^'"`]+)['"`]\s*,\s*answer\s*:\s*['"`]([^'"`]+)['"`]\s*,?\s*\}/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(body)) !== null) {
    pairs.push({ question: match[1], answer: match[2] });
  }
  return pairs;
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
    const faq = extractFAQ(src);

    if (faq.length === 0) {
      violations.push(
        error(
          'faq-missing',
          `Tool "${slug}" has no FAQ items.`,
          {
            file: relPath,
            hint: 'Add 5+ real questions and answers.',
          },
        ),
      );
      continue;
    }

    if (faq.length < 5) {
      violations.push(
        warning(
          'faq-few-items',
          `Tool "${slug}" has only ${faq.length} FAQ items (target 5+).`,
          { file: relPath },
        ),
      );
    }

    const seen = new Set<string>();
    for (const pair of faq) {
      const normalizedQ = pair.question.trim().toLowerCase();

      if (seen.has(normalizedQ)) {
        violations.push(
          error(
            'faq-duplicate-question',
            `Duplicate FAQ: "${pair.question.slice(0, 40)}..."`,
            { file: relPath },
          ),
        );
      }
      seen.add(normalizedQ);

      if (!pair.question.trim().endsWith('?')) {
        violations.push(
          warning(
            'faq-question-no-question-mark',
            `Question does not end with "?": "${pair.question.slice(0, 40)}"`,
            { file: relPath },
          ),
        );
      }

      if (pair.answer.length < 40) {
        violations.push(
          error(
            'faq-answer-too-short',
            `Answer is only ${pair.answer.length} chars: "${pair.question.slice(0, 40)}..."`,
            {
              file: relPath,
              hint: 'Answers should be at least 40 characters.',
            },
          ),
        );
      }

      const firstWord = pair.answer.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
      if ((firstWord === 'yes' || firstWord === 'no') && pair.answer.length < 100) {
        violations.push(
          warning(
            'faq-answer-too-terse',
            `Answer starts with "${firstWord}" but is brief. Add context.`,
            { file: relPath },
          ),
        );
      }
    }
  }

  return violations;
}
