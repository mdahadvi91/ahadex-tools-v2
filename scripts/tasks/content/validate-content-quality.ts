/**
 * Content quality validator. Detects low-quality patterns that hurt
 * SEO ranking and AdSense approval:
 *   - Marketing superlatives without evidence
 *   - Placeholder text (TODO, lorem ipsum, coming soon)
 *   - Repetitive sentences (keyword stuffing)
 *   - Sentence length extremes (too short or too long)
 *   - Empty or short paragraphs
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

const FORBIDDEN_PATTERNS: Array<{ name: string; regex: RegExp; severity: 'error' | 'warning' }> = [
  { name: 'lorem-ipsum', regex: /\blorem ipsum\b/i, severity: 'error' },
  { name: 'todo-marker', regex: /\bTODO\b|\bFIXME\b|\bXXX\b/, severity: 'warning' },
  { name: 'coming-soon', regex: /\bcoming soon\b|\bunder construction\b/i, severity: 'error' },
  { name: 'marketing-superlative', regex: /\b(?:the )?best (?:image|compressor|tool|way to)\b/i, severity: 'warning' },
  { name: 'false-guarantee', regex: /\bguaranteed (?:results?|to work|success)\b/i, severity: 'error' },
  { name: 'world-best', regex: /\bworld'?s (?:best|leading|first)\b/i, severity: 'warning' },
  { name: 'revolutionary', regex: /\brevolutionary\b/i, severity: 'warning' },
  { name: 'placeholder-text', regex: /\bplaceholder\b|\bdummy text\b/i, severity: 'error' },
];

const MIN_PARAGRAPH_LENGTH = 50;
const MAX_SENTENCE_LENGTH = 300;

/** Extracts all paragraph-like string literals (60+ chars). */
function extractParagraphs(src: string): Array<{ text: string; line: number }> {
  const out: Array<{ text: string; line: number }> = [];
  const re = /['"`]([^'"`]{40,})['"`]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    out.push({ text: m[1], line: lineNumberAt(src, m.index) });
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

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const contentFiles = (await walkFiles(PATHS.srcTools, { extensions: ['.ts'] })).filter(
    (f) => f.endsWith('/content.ts'),
  );

  for (const file of contentFiles) {
    const relPath = file.substring(PATHS.root.length + 1).split('\\').join('/');
    const src = await readText(file);

    // Rule 1: forbidden patterns.
    for (const pattern of FORBIDDEN_PATTERNS) {
      const re = new RegExp(pattern.regex.source, pattern.regex.flags);
      let m: RegExpExecArray | null;
      while ((m = re.exec(src)) !== null) {
        const line = lineNumberAt(src, m.index);
        if (pattern.severity === 'error') {
          violations.push(
            error(
              `content-${pattern.name}`,
              `Forbidden pattern: ${pattern.name}.`,
              {
                file: relPath,
                line,
                hint: `Matched: "${m[0].slice(0, 60)}"`,
              },
            ),
          );
        } else {
          violations.push(
            warning(
              `content-${pattern.name}`,
              `Suspicious pattern: ${pattern.name}.`,
              {
                file: relPath,
                line,
                hint: `Matched: "${m[0].slice(0, 60)}"`,
              },
            ),
          );
        }
        if (m.index === re.lastIndex) re.lastIndex += 1;
      }
    }

    // Rule 2: paragraph length.
    const paragraphs = extractParagraphs(src);
    for (const p of paragraphs) {
      if (p.text.length < MIN_PARAGRAPH_LENGTH) {
        violations.push(
          warning(
            'paragraph-too-short',
            `Paragraph is only ${p.text.length} chars.`,
            {
              file: relPath,
              line: p.line,
              hint: 'Short paragraphs may indicate thin content.',
            },
          ),
        );
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

    // Rule 4: repeated sentences (keyword stuffing indicator).
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
        warning(
          'duplicate-sentence',
          `Sentence appears more than once: "${dup.slice(0, 60)}..."`,
          { file: relPath, hint: 'Duplicate sentences indicate thin or stuffed content.' },
        ),
      );
    }
  }

  return violations;
}
