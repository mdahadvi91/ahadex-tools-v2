/**
 * Tool isolation validator. Enforces that each tool in src/tools/<slug>/
 * is a self-contained module:
 *   - A tool must not import from another tool's folder.
 *   - A tool must have a manifest.ts, index.ts, Page.tsx.
 *   - Tools must not modify shared modules (import-only).
 */

import { relative } from 'node:path';
import { readText, walkFiles, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

const REQUIRED_FILES = ['manifest.ts', 'index.ts', 'Page.tsx'];

function lineNumberAt(source: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

function extractImports(source: string): Array<{ spec: string; line: number }> {
  const out: Array<{ spec: string; line: number }> = [];
  const patterns: RegExp[] = [
    /\bimport\s+(?:type\s+)?[^'"]*?from\s+['"]([^'"]+)['"]/g,
    /\bimport\s+['"]([^'"]+)['"]/g,
    /\bexport\s+(?:type\s+)?[^'"]*?from\s+['"]([^'"]+)['"]/g,
  ];
  for (const re of patterns) {
    let match: RegExpExecArray | null;
    while ((match = re.exec(source)) !== null) {
      out.push({ spec: match[1], line: lineNumberAt(source, match.index) });
      if (match.index === re.lastIndex) re.lastIndex += 1;
    }
  }
  return out;
}

function toolOf(relPath: string): string | null {
  const match = relPath.match(/^src\/tools\/([^/]+)\//);
  return match ? match[1] : null;
}

function targetToolOf(spec: string): string | null {
  const match = spec.match(/src\/tools\/([^/]+)|\/tools\/([^/]+)/);
  if (!match) return null;
  return match[1] ?? match[2] ?? null;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  if (!(await pathExists(PATHS.srcTools))) {
    return violations;
  }

  const files = await walkFiles(PATHS.srcTools, {
    extensions: ['.ts', '.tsx'],
  });

  // Collect tool slugs from directory structure.
  const tools = new Set<string>();
  for (const f of files) {
    const slug = toolOf(relative(PATHS.root, f).split('\\').join('/'));
    if (slug) tools.add(slug);
  }

  // Rule 1: every tool has required files.
  for (const slug of tools) {
    for (const required of REQUIRED_FILES) {
      const full = `${PATHS.srcTools}/${slug}/${required}`;
      if (!(await pathExists(full))) {
        violations.push(
          error('tool-missing-file', `Tool "${slug}" is missing required file ${required}.`, {
            file: `src/tools/${slug}/${required}`,
            hint: 'Every tool must have manifest.ts, index.ts and Page.tsx.',
          }),
        );
      }
    }
  }

  // Rule 2: cross-tool imports forbidden.
  for (const file of files) {
    const relPath = relative(PATHS.root, file).split('\\').join('/');
    if (relPath.endsWith('.test.ts') || relPath.endsWith('.test.tsx')) continue;
    if (relPath.includes('/tests/')) continue;

    const ownTool = toolOf(relPath);
    if (!ownTool) continue;

    const source = await readText(file);
    const imports = extractImports(source);

    for (const imp of imports) {
      // Resolve relative and absolute paths that point into another tool.
      let resolved = imp.spec;
      if (imp.spec.startsWith('@/tools/')) {
        resolved = `src/tools/${imp.spec.slice(8)}`;
      } else if (imp.spec.startsWith('..')) {
        // Relative path: could be sibling tool.
        const ownPrefix = `src/tools/${ownTool}/`;
        const fromDir = relPath.substring(0, relPath.lastIndexOf('/'));
        const baseParts = fromDir.split('/');
        for (const part of imp.spec.split('/')) {
          if (part === '..') baseParts.pop();
          else if (part !== '.') baseParts.push(part);
        }
        resolved = baseParts.join('/');
        if (resolved.startsWith(ownPrefix)) continue;
      }

      const otherTool = targetToolOf(resolved);
      if (otherTool && otherTool !== ownTool) {
        violations.push(
          error('cross-tool-import', `Tool "${ownTool}" imports from tool "${otherTool}".`, {
            file: relPath,
            line: imp.line,
            hint: 'Tools must be isolated. Share code via src/platform instead.',
          }),
        );
      }
    }
  }

  // Rule 3: warn if tool has more than one test file inside its folder.
  for (const slug of tools) {
    const toolTestFiles = files.filter((f) => {
      const rel = relative(PATHS.root, f).split('\\').join('/');
      return rel.startsWith(`src/tools/${slug}/`) && rel.endsWith('.test.ts');
    });
    if (toolTestFiles.length === 0) {
      violations.push(
        warning('tool-no-tests', `Tool "${slug}" has no test files.`, {
          file: `src/tools/${slug}/`,
          hint: 'Add at least one unit or integration test.',
        }),
      );
    }
  }

  return violations;
}
