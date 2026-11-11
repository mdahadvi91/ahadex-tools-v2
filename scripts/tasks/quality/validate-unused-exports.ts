/**
 * Detects exported symbols that are never imported elsewhere.
 * A heuristic, not a proof: false negatives are possible for
 * exports accessed only via dynamic imports.
 */

import { relative } from 'node:path';
import { readText, walkFiles } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { warning, type Violation } from '../../utils/validation-result';

const SOURCE_EXTS = ['.ts', '.tsx'];

/**
 * Extracts named exports from a file's text. Handles:
 *   export function foo
 *   export const foo
 *   export class Foo
 *   export async function foo
 *   export { a, b }
 *   export type Foo
 *   export interface Foo
 */
function extractExports(source: string): string[] {
  const names = new Set<string>();

  const namedExportBlock = /export\s*\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = namedExportBlock.exec(source)) !== null) {
    const parts = m[1].split(',').map((s) => s.trim());
    for (const part of parts) {
      if (!part) continue;
      const asMatch = part.match(/\bas\s+([A-Za-z_$][\w$]*)/);
      const rawName = asMatch ? asMatch[1] : part;
      if (rawName) names.add(rawName);
    }
  }

  const declPatterns = [
    /export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g,
    /export\s+const\s+([A-Za-z_$][\w$]*)/g,
    /export\s+let\s+([A-Za-z_$][\w$]*)/g,
    /export\s+class\s+([A-Za-z_$][\w$]*)/g,
    /export\s+interface\s+([A-Za-z_$][\w$]*)/g,
    /export\s+type\s+([A-Za-z_$][\w$]*)/g,
    /export\s+enum\s+([A-Za-z_$][\w$]*)/g,
  ];
  for (const pattern of declPatterns) {
    let dm: RegExpExecArray | null;
    while ((dm = pattern.exec(source)) !== null) {
      names.add(dm[1]);
    }
  }

  return Array.from(names);
}

function isBarrelFile(source: string): boolean {
  const trimmed = source.trim();
  if (trimmed === '') return false;
  const lines = trimmed.split('\n').filter((l) => l.trim() !== '' && !l.trim().startsWith('//'));
  return lines.every((l) => /^export\s/.test(l.trim()) && l.includes('from'));
}

interface ExportInfo {
  file: string;
  name: string;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const sourceFiles = (
    await Promise.all([
      walkFiles(PATHS.src, { extensions: SOURCE_EXTS }),
      walkFiles(PATHS.scripts, { extensions: SOURCE_EXTS }),
    ])
  )
    .flat()
    .filter((f) => !f.endsWith('.test.ts') && !f.endsWith('.test.tsx'));

  const allExports: ExportInfo[] = [];
  const allContents = new Map<string, string>();

  for (const file of sourceFiles) {
    const source = await readText(file);
    allContents.set(file, source);
    if (isBarrelFile(source)) continue;
    const names = extractExports(source);
    for (const name of names) {
      allExports.push({ file, name });
    }
  }

  for (const { file, name } of allExports) {
    let used = false;
    for (const [otherFile, otherContent] of allContents) {
      if (otherFile === file) continue;
      const importPattern = new RegExp(
        `import\\s+(?:type\\s+)?[\\w\\s{},*$]*\\b${name}\\b[\\s\\S]*?from\\s+['"]`,
      );
      const dynamicPattern = new RegExp(`import\\([^)]*\\b${name}\\b`);
      if (importPattern.test(otherContent) || dynamicPattern.test(otherContent)) {
        used = true;
        break;
      }
    }
    if (!used) {
      violations.push(
        warning('unused-export', `Export "${name}" is not imported anywhere.`, {
          file: relative(PATHS.root, file).split('\\').join('/'),
          hint: 'Remove the export or add an import. False positives possible for dynamic imports.',
        }),
      );
    }
  }

  return violations;
}
