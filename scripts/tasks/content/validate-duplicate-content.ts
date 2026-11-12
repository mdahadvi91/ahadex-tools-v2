/**
 * Duplicate content validator. Detects content overlap between tools
 * that could cause duplicate content penalties:
 *   - No two tools share the same H1
 *   - No two tools share the same DIRECT_ANSWER
 *   - Paragraph overlap between tools must be under 20%
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

interface ToolContent {
  slug: string;
  file: string;
  h1: string | null;
  directAnswer: string | null;
  paragraphs: string[];
}

function extractH1(src: string): string | null {
  const m = src.match(/h1\s*:\s*['"`]([^'"`]+)['"`]/);
  return m ? m[1] : null;
}

function extractDirectAnswer(src: string): string | null {
  const m = src.match(/DIRECT_ANSWER\s*=\s*(?:\n\s*)?['"`]([^'"`]+)['"`]/);
  return m ? m[1] : null;
}

function extractParagraphs(src: string): string[] {
  const paragraphs: string[] = [];
  const re = /['"`]([^'"`]{80,})['"`]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    paragraphs.push(m[1].toLowerCase().trim());
  }
  return paragraphs;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const contentFiles = (await walkFiles(PATHS.srcTools, { extensions: ['.ts'] })).filter((f) =>
    f.endsWith('/content.ts'),
  );

  if (contentFiles.length < 2) return violations;

  const tools: ToolContent[] = [];
  for (const file of contentFiles) {
    const relPath = file
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');
    const slug = relPath.match(/tools\/([^/]+)\//)?.[1] ?? 'unknown';
    const src = await readText(file);
    tools.push({
      slug,
      file: relPath,
      h1: extractH1(src),
      directAnswer: extractDirectAnswer(src),
      paragraphs: extractParagraphs(src),
    });
  }

  // Rule 1: no duplicate h1.
  const h1Index = new Map<string, string>();
  for (const tool of tools) {
    if (!tool.h1) continue;
    if (h1Index.has(tool.h1)) {
      violations.push(
        error(
          'duplicate-h1',
          `H1 "${tool.h1}" is used by both ${h1Index.get(tool.h1)} and ${tool.slug}.`,
          {
            file: tool.file,
            hint: 'Each tool must have a unique h1.',
          },
        ),
      );
    } else {
      h1Index.set(tool.h1, tool.slug);
    }
  }

  // Rule 2: no duplicate direct answer.
  const daIndex = new Map<string, string>();
  for (const tool of tools) {
    if (!tool.directAnswer) continue;
    if (daIndex.has(tool.directAnswer)) {
      violations.push(
        error(
          'duplicate-direct-answer',
          `Direct answer is duplicated between ${daIndex.get(tool.directAnswer)} and ${tool.slug}.`,
          { file: tool.file },
        ),
      );
    } else {
      daIndex.set(tool.directAnswer, tool.slug);
    }
  }

  // Rule 3: paragraph overlap check.
  for (let i = 0; i < tools.length; i++) {
    for (let j = i + 1; j < tools.length; j++) {
      const a = tools[i];
      const b = tools[j];
      if (a.paragraphs.length === 0 || b.paragraphs.length === 0) continue;

      const aSet = new Set(a.paragraphs);
      const bSet = new Set(b.paragraphs);
      let overlap = 0;
      for (const p of aSet) {
        if (bSet.has(p)) overlap++;
      }
      const ratio = overlap / Math.min(aSet.size, bSet.size);
      if (ratio > 0.2) {
        violations.push(
          warning(
            'duplicate-paragraphs',
            `${Math.round(ratio * 100)}% paragraph overlap between ${a.slug} and ${b.slug}.`,
            {
              file: a.file,
              hint: 'Rewrite shared paragraphs to be tool-specific.',
            },
          ),
        );
      }
    }
  }

  return violations;
}
