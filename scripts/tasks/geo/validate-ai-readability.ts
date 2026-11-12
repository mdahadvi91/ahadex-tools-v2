/**
 * AI readability validator. Ensures content is easy for LLMs to
 * parse and quote:
 *   - Paragraphs are 2-4 sentences (60-500 chars)
 *   - No paragraph is a single 500+ word block
 *   - Uses lists for enumerations (not comma-separated inline)
 *   - Avoids first-person plural ("we", "our") in factual content
 *   - Sentence length 10-35 words (readability target)
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { warning, type Violation } from '../../utils/validation-result';

const MIN_PARAGRAPH_LENGTH = 60;
const MAX_PARAGRAPH_LENGTH = 500;
const MIN_SENTENCE_WORDS = 5;
const MAX_SENTENCE_WORDS = 40;

/** Extract paragraph-like strings (60+ chars, no newline). */
function extractParagraphs(src: string): Array<{ text: string; line: number }> {
  const out: Array<{ text: string; line: number }> = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "'" || c === '"' || c === '`') {
      const quote = c;
      const start = i;
      let j = i + 1;
      let body = '';
      while (j < src.length) {
        if (src[j] === '\\') {
          body += src[j];
          if (j + 1 < src.length) body += src[j + 1];
          j += 2;
          continue;
        }
        if (src[j] === quote) break;
        body += src[j];
        j++;
      }
      if (body.length >= MIN_PARAGRAPH_LENGTH && !body.includes('\n')) {
        out.push({ text: body, line: lineNumberAt(src, start) });
      }
      i = j + 1;
      continue;
    }
    i++;
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

function countSentences(text: string): number {
  return text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const contentFiles = (await walkFiles(PATHS.srcTools, { extensions: ['.ts'] })).filter(
    (f) => f.endsWith('/content.ts'),
  );

  for (const file of contentFiles) {
    const relPath = file.substring(PATHS.root.length + 1).split('\\').join('/');
    const src = await readText(file);
    const paragraphs = extractParagraphs(src);

    for (const p of paragraphs) {
      // Rule 1: paragraph length upper bound.
      if (p.text.length > MAX_PARAGRAPH_LENGTH) {
        violations.push(
          warning(
            'ai-paragraph-too-long',
            `Paragraph is ${p.text.length} chars (max ${MAX_PARAGRAPH_LENGTH}).`,
            {
              file: relPath,
              line: p.line,
              hint: 'Split long paragraphs — AI systems prefer short blocks.',
            },
          ),
        );
      }

      // Rule 2: sentence count per paragraph.
      const sentences = countSentences(p.text);
      if (sentences > 6) {
        violations.push(
          warning(
            'ai-too-many-sentences',
            `Paragraph has ${sentences} sentences (target 2-4).`,
            { file: relPath, line: p.line },
          ),
        );
      }

      // Rule 3: sentence word count.
      for (const sentence of p.text.split(/[.!?]+/)) {
        const words = wordCount(sentence.trim());
        if (words > 0 && words < MIN_SENTENCE_WORDS) {
          violations.push(
            warning(
              'ai-sentence-too-short',
              `Sentence has only ${words} words: "${sentence.trim().slice(0, 40)}"`,
              { file: relPath, line: p.line },
            ),
          );
        }
        if (words > MAX_SENTENCE_WORDS) {
          violations.push(
            warning(
              'ai-sentence-too-long',
              `Sentence has ${words} words (max ${MAX_SENTENCE_WORDS}).`,
              { file: relPath, line: p.line },
            ),
          );
        }
      }

      // Rule 4: first-person plural in factual content.
      if (/\bwe\b|\bour\b|\bus\b/i.test(p.text) && p.text.length > 100) {
        violations.push(
          warning(
            'ai-first-person',
            'Paragraph uses first-person plural ("we"/"our"/"us") in factual content.',
            {
              file: relPath,
              line: p.line,
              hint: 'Third-person is more citable by AI systems.',
            },
          ),
        );
      }
    }

    // Rule 5: at least one list in the file (for enumerations).
    if (!/\[\s*['"`]/.test(src) || !src.includes('list')) {
      violations.push(
        warning(
          'ai-no-list-usage',
          `Tool may not use lists for enumerations.`,
          {
            file: relPath,
            hint: 'Lists improve AI readability for multi-item content.',
          },
        ),
      );
    }
  }

  return violations;
}
