/**
 * Content quality validator. Detects low-quality patterns that hurt
 * SEO ranking and AdSense approval.
 *
 * Uses linear string scanning instead of complex regex to avoid
 * catastrophic backtracking on large files.
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

const FORBIDDEN_PATTERNS: Array<{ name: string; regex: RegExp; severity: 'error' | 'warning' }> = [
  { name: 'lorem-ipsum', regex: /\blorem ipsum\b/i, severity: 'error' },
  { name: 'todo-marker', regex: /\bTODO\b|\bFIXME\b|\bXXX\b/, severity: 'warning' },
  { name: 'coming-soon', regex: /\bcoming soon\b|\bunder construction\b/i, severity: 'error' },
  {
    name: 'marketing-superlative',
    regex: /\b(?:the )?best (?:image|compressor|tool|way to)\b/i,
    severity: 'warning',
  },
  {
    name: 'false-guarantee',
    regex: /\bguaranteed (?:results?|to work|success)\b/i,
    severity: 'error',
  },
  { name: 'world-best', regex: /\bworld'?s (?:best|leading|first)\b/i, severity: 'warning' },
  { name: 'revolutionary', regex: /\brevolutionary\b/i, severity: 'warning' },
  { name: 'placeholder-text', regex: /\bplaceholder\b|\bdummy text\b/i, severity: 'error' },
];

const MIN_PARAGRAPH_LENGTH = 40;
const MAX_SENTENCE_LENGTH = 300;
const MIN_PARAGRAPH_FOR_QUALITY = 80;

function lineNumberAt(source: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

/**
 * Extracts paragraph-like string literals using linear scanning.
 * A "paragraph" is any single-quoted, double-quoted, or backtick
 * string literal with 40+ characters of content. Skips strings that
 * contain newlines (those are multi-line template literals; not
 * treated as paragraphs).
 */
function extractParagraphs(src: string): Array<{ text: string; line: number }> {
  const out: Array<{ text: string; line: number }> = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "'" || c === '"' || c === '`') {
      const quote = c;
      const start = i;
      let j = i + 1;
      while (j < src.length) {
        if (src[j] === '\\') {
          j += 2;
          continue;
        }
        if (src[j] === quote) break;
        j++;
      }
      const body = src.slice(start + 1, j);
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

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const contentFiles = (await walkFiles(PATHS.srcTools, { extensions: ['.ts'] })).filter((f) =>
    f.endsWith('/content.ts'),
  );

  for (const file of contentFiles) {
    const relPath = file
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');
    const src = await readText(file);

    // Rule 1: forbidden patterns.
    for (const pattern of FORBIDDEN_PATTERNS) {
      const re = new RegExp(pattern.regex.source, pattern.regex.flags);
      let m: RegExpExecArray | null;
      while ((m = re.exec(src)) !== null) {
        const line = lineNumberAt(src, m.index);
        if (pattern.severity === 'error') {
          violations.push(
            error(`content-${pattern.name}`, `Forbidden pattern: ${pattern.name}.`, {
              file: relPath,
              line,
              hint: `Matched: "${m[0].slice(0, 60)}"`,
            }),
          );
        } else {
          violations.push(
            warning(`content-${pattern.name}`, `Suspicious pattern: ${pattern.name}.`, {
              file: relPath,
              line,
              hint: `Matched: "${m[0].slice(0, 60)}"`,
            }),
          );
        }
        if (m.index === re.lastIndex) re.lastIndex += 1;
      }
    }

    // Rule 2: paragraph length.
    const paragraphs = extractParagraphs(src);
    for (const p of paragraphs) {
      if (p.text.length < MIN_PARAGRAPH_FOR_QUALITY && p.text.length >= MIN_PARAGRAPH_LENGTH) {
        // Short paragraphs are common (list items, headers) so only
        // warn if the paragraph looks like prose (contains a space).
        if (p.text.includes(' ')) {
          violations.push(
            warning('paragraph-too-short', `Paragraph is only ${p.text.length} chars.`, {
              file: relPath,
              line: p.line,
              hint: 'Very short paragraphs may indicate thin content.',
            }),
          );
        }
      }
    }

    // Rule 3: sentence length.
    for (const p of paragraphs) {
      for (const sentence of splitSentences(p.text)) {
        if (sentence.length > MAX_SENTENCE_LENGTH) {
          violations.push(
            warning(
              'sentence-too-long',
              `Sentence is ${sentence.length} chars (max ${MAX_SENTENCE_LENGTH}).`,
              {
                file: relPath,
                line: p.line,
                hint: 'Long sentences hurt readability.',
              },
            ),
          );
        }
      }
    }

    // Rule 4: repeated sentences.
    const allSentences = new Set<string>();
    const duplicates = new Set<string>();
    for (const p of paragraphs) {
      for (const s of splitSentences(p.text)) {
        const normalized = s.toLowerCase().trim();
        if (normalized.length < 30) continue;
        if (allSentences.has(normalized)) duplicates.add(s);
        else allSentences.add(normalized);
      }
    }
    for (const dup of duplicates) {
      violations.push(
        warning('duplicate-sentence', `Sentence appears more than once: "${dup.slice(0, 60)}..."`, {
          file: relPath,
          hint: 'Duplicate sentences indicate thin or stuffed content.',
        }),
      );
    }
  }

  return violations;
}
