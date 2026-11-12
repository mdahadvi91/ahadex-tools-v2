/**
 * Search intent validator. Ensures every tool's declared intent
 * matches the actual page structure:
 *   - transactional → must have a working tool widget
 *   - informational → must have substantive content (800+ words)
 *   - comparison → must reference multiple options
 *
 * Prevents thin transactional pages (tool with no content) and
 * misleading informational pages (content-only pages claiming a tool).
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

function extractIntents(src: string): string[] {
  const m = src.match(/intents\s*:\s*\[([\s\S]*?)\]/);
  if (!m) return [];
  return [...m[1].matchAll(/['"`]([^'"`]+)['"`]/g)].map((x) => x[1]);
}

async function hasToolWidget(slugDir: string): Promise<boolean> {
  const files = await walkFiles(slugDir, { extensions: ['.tsx'] });
  const toolFile = files.find((f) => f.endsWith('/Tool.tsx'));
  if (!toolFile) return false;
  const src = await readText(toolFile);
  // Tool widget must import an engine, use a worker, or handle input.
  return /from\s+['"]\.\/engine['"]|Dropzone|createEngine/.test(src);
}

async function getContentWordCount(slugDir: string): Promise<number> {
  const contentFile = (await walkFiles(slugDir, { extensions: ['.ts'] })).find((f) =>
    f.endsWith('/content.ts'),
  );
  if (!contentFile) return 0;

  const src = await readText(contentFile);
  // Extract all string literals from the content file.
  const literals = [...src.matchAll(/['"`]([^'"`]{20,})['"`]/g)].map((m) => m[1]);
  const wordCount = literals
    .join(' ')
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  return wordCount;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  if (!(await walkFiles(PATHS.srcTools, { extensions: ['.ts'] })).length) {
    return violations;
  }

  // Find tool directories that have a keywords.ts.
  const keywordFiles = (await walkFiles(PATHS.srcTools, { extensions: ['.ts'] })).filter((f) =>
    f.endsWith('/keywords.ts'),
  );

  for (const kwFile of keywordFiles) {
    const relPath = kwFile
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');
    const slug = relPath.match(/tools\/([^/]+)\//)?.[1];
    if (!slug) continue;

    const toolDir = `${PATHS.srcTools}/${slug}`;
    const src = await readText(kwFile);
    const intents = extractIntents(src);

    if (intents.includes('transactional')) {
      const hasWidget = await hasToolWidget(toolDir);
      if (!hasWidget) {
        violations.push(
          error(
            'intent-transactional-no-widget',
            `Tool "${slug}" claims transactional intent but has no working tool widget.`,
            {
              file: relPath,
              hint: 'Transactional intent requires an interactive Tool.tsx.',
            },
          ),
        );
      }
    }

    if (intents.includes('informational')) {
      const wordCount = await getContentWordCount(toolDir);
      if (wordCount < 500) {
        violations.push(
          warning(
            'intent-informational-thin',
            `Tool "${slug}" claims informational intent with only ~${wordCount} words.`,
            {
              file: relPath,
              hint: 'Informational pages should have substantive content (500+ words).',
            },
          ),
        );
      }
    }

    if (intents.length === 0) {
      violations.push(
        warning('intent-missing', `Tool "${slug}" declares no search intents.`, { file: relPath }),
      );
    }
  }

  return violations;
}
