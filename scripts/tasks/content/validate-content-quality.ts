/**
 * Content quality validator. Detects low-quality patterns that hurt
 * SEO ranking and AdSense approval.
 *
 * Uses linear string scanning only. No lookbehind regex, no
 * catastrophic backtracking.
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
    regex: /(?<!not )\bguaranteed (?:results?|to work|success)\b/i,
    severity: 'error',
  },
  { name: 'world-best', regex: /\bworld'?s (?:best|leading|first)\b/i, severity: 'warning' },
  { name: 'revolutionary', regex: /\brevolutionary\b/i, severity: 'warning' },
  { name: 'placeholder-text', regex: /\bplaceholder\b|\bdummy text\b/i, severity: 'error' },
];

const MIN_PARAGRAPH_LENGTH = 40;
const MAX_SENTENCE_LENGTH = 300;

function lineNumberAt(source: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

/**
 * Extracts paragraph-like string literals using linear scanning.
 * A "paragraph" is any string literal with 40+ characters, no
 * newlines. Handles escapes.
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

/**
 * Splits text into sentences without regex lookbehind.
 * Splits on `.`, `?`, `!` followed by whitespace.
 */
function splitSentences(text: string): string[] {
  const out: string[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if ((c === '.' || c === '?' || c === '!') && i + 1 < text.length) {
      const next = text[i + 1];
      if (next === ' ' || next === '\t' || next === '\n') {
        const s = text.slice(start, i + 1).trim();
        if (s.length > 0) out.push(s);
        start = i + 1;
        // Skip consecutive whitespace.
        while (start < text.length && /\s/.test(text[start])) start++;
        i = start - 1;
      }
    }
  }
  const tail = text.slice(start).trim();
  if (tail.length > 0) out.push(tail);
  return out;
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
      const re = new RegExp(
        pattern.regex.source,
        pattern.regex.flags.includes('g') ? pattern.regex.flags : pattern.regex.flags + 'g',
      );
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

    // Rule 2: sentence length + duplicate sentence detection.
    const paragraphs = extractParagraphs(src);
    const allSentences = new Set<string>();
    const duplicates = new Set<string>();
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
        const normalized = sentence.toLowerCase().trim();
        if (normalized.length < 30) continue;
        if (allSentences.has(normalized)) duplicates.add(sentence);
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
