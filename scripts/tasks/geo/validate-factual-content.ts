/**
 * Factual content validator. Detects claims that are not verifiable
 * from the tool's own code or authoritative references:
 *   - Claims like "the best", "the fastest" without measurement
 *   - Percentages/factors without a source
 *   - Comparisons with competitors
 *   - Claims about third-party products
 *   - Statements implying specific browser support without citation
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { warning, type Violation } from '../../utils/validation-result';

const SUSPICIOUS_PATTERNS: Array<{
  name: string;
  regex: RegExp;
  hint: string;
}> = [
  {
    name: 'absolute-superlative',
    regex: /\b(?:the )?(?:best|fastest|most powerful|number one|#1|leading)\b/i,
    hint: 'Superlatives require evidence. Cite or remove.',
  },
  {
    name: 'unsourced-percentage',
    regex: /\b\d{1,3}%\s+(?:faster|smaller|better|more|less)\b/i,
    hint: 'Percentages need a source or specific measurement.',
  },
  {
    name: 'unsourced-factor',
    regex: /\b\d+x\s+(?:faster|smaller|better|more)\b/i,
    hint: 'Multiplicative claims need a source.',
  },
  {
    name: 'competitor-comparison',
    regex:
      /\b(?:unlike|compared to|better than)\s+(?:Photoshop|TinyPNG|Adobe|Canva|Google Images|iLoveIMG|Squoosh)\b/i,
    hint: 'Competitor comparisons risk legal issues. Remove or cite official sources.',
  },
  {
    name: 'guaranteed-outcome',
    regex: /\bguaranteed?\b/i,
    hint: 'Guarantees cannot be made for file processing.',
  },
  {
    name: 'official-endorsement',
    regex:
      /\b(?:official|endorsed|approved by|recommended by)\s+(?:Google|Microsoft|Apple|Mozilla|W3C)\b/i,
    hint: 'Do not claim third-party endorsement.',
  },
  {
    name: 'browser-support-unqualified',
    regex: /\b(?:works on all|supported by every|universally supported)\b/i,
    hint: 'Browser support varies; specify versions or cite caniuse.',
  },
];

function lineNumberAt(source: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

/** Check that a statement has an inline reference within 300 chars. */
function hasNearbyReference(src: string, index: number): boolean {
  const start = Math.max(0, index - 300);
  const end = Math.min(src.length, index + 300);
  const window = src.slice(start, end);
  return /https?:\/\/|MDN|W3C|according to|source:|cite|Reference/i.test(window);
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

    for (const pattern of SUSPICIOUS_PATTERNS) {
      const re = new RegExp(
        pattern.regex.source,
        pattern.regex.flags.includes('g') ? pattern.regex.flags : pattern.regex.flags + 'g',
      );
      let m: RegExpExecArray | null;
      while ((m = re.exec(src)) !== null) {
        // Skip if a reference is nearby (within 300 chars).
        if (hasNearbyReference(src, m.index)) {
          if (m.index === re.lastIndex) re.lastIndex += 1;
          continue;
        }
        violations.push(
          warning(`factual-${pattern.name}`, `Suspicious claim: "${m[0].slice(0, 60)}"`, {
            file: relPath,
            line: lineNumberAt(src, m.index),
            hint: pattern.hint,
          }),
        );
        if (m.index === re.lastIndex) re.lastIndex += 1;
      }
    }
  }

  return violations;
}
