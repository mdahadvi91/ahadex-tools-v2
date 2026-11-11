/**
 * Content sources validator. Ensures tool content cites authoritative
 * sources when making technical claims:
 *   - Content with external references must have REFERENCES array
 *   - Every reference must have a valid HTTPS URL
 *   - Every reference must have a label and note
 *   - Claim-heavy content (mentions "according to", "research shows")
 *     without sources triggers a warning
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { warning, type Violation } from '../../utils/validation-result';

interface ReferenceEntry {
  label?: string;
  url?: string;
  note?: string;
}

function extractReferences(src: string): ReferenceEntry[] {
  const m = src.match(/REFERENCES\s*[^=]*=\s*\[([\s\S]*?)\];/);
  if (!m) return [];

  const body = m[1];
  const entries: ReferenceEntry[] = [];
  const re = /\{([^{}]+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(body)) !== null) {
    const obj = match[1];
    const entry: ReferenceEntry = {};
    const labelM = obj.match(/label\s*:\s*['"`]([^'"`]+)['"`]/);
    const urlM = obj.match(/url\s*:\s*['"`]([^'"`]+)['"`]/);
    const noteM = obj.match(/note\s*:\s*['"`]([^'"`]+)['"`]/);
    if (labelM) entry.label = labelM[1];
    if (urlM) entry.url = urlM[1];
    if (noteM) entry.note = noteM[1];
    entries.push(entry);
  }
  return entries;
}

function countClaimIndicators(src: string): number {
  const patterns = [
    /\baccording to\b/gi,
    /\bresearch shows\b/gi,
    /\bstudies show\b/gi,
    /\bscientists say\b/gi,
    /\bexperts recommend\b/gi,
    /\bindustry standard\b/gi,
  ];
  let count = 0;
  for (const pattern of patterns) {
    const matches = src.match(pattern);
    if (matches) count += matches.length;
  }
  return count;
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
    const refs = extractReferences(src);

    // Rule 1: at least 2 references per tool.
    if (refs.length === 0) {
      violations.push(
        warning(
          'content-no-references',
          `Tool "${slug}" has no REFERENCES array.`,
          {
            file: relPath,
            hint: 'Cite authoritative sources for technical claims (MDN, W3C, Google).',
          },
        ),
      );
    } else if (refs.length < 2) {
      violations.push(
        warning(
          'content-few-references',
          `Tool "${slug}" has only ${refs.length} reference (target 2+).`,
          { file: relPath },
        ),
      );
    }

    // Rule 2: each reference must have url + label + note.
    for (let i = 0; i < refs.length; i++) {
      const ref = refs[i];
      if (!ref.url) {
        violations.push(
          warning(
            'reference-no-url',
            `Reference #${i + 1} has no URL.`,
            { file: relPath },
          ),
        );
      } else if (!ref.url.startsWith('https://')) {
        violations.push(
          warning(
            'reference-not-https',
            `Reference #${i + 1} URL is not HTTPS: ${ref.url}`,
            { file: relPath },
          ),
        );
      }
      if (!ref.label) {
        violations.push(
          warning('reference-no-label', `Reference #${i + 1} has no label.`, {
            file: relPath,
          }),
        );
      }
      if (!ref.note) {
        violations.push(
          warning('reference-no-note', `Reference #${i + 1} has no note.`, {
            file: relPath,
          }),
        );
      }
    }

    // Rule 3: claim indicators without references.
    const claimCount = countClaimIndicators(src);
    if (claimCount > 0 && refs.length === 0) {
      violations.push(
        warning(
          'content-unsourced-claims',
          `Tool "${slug}" has ${claimCount} claim indicators but no references.`,
          {
            file: relPath,
            hint: 'Cite sources for claims that affect trust.',
          },
        ),
      );
    }
  }

  return violations;
}
