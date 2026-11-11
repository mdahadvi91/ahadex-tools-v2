/**
 * Circular dependency detector. Builds a module graph from src/ and
 * scripts/ and reports any cycle. Uses Tarjan's strongly connected
 * components algorithm.
 */

import { relative } from 'node:path';
import { readText, walkFiles } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, type Violation } from '../../utils/validation-result';

interface Edge {
  from: string;
  to: string;
  line: number;
}

function extractImportSpecifiers(source: string): Array<{ spec: string; line: number }> {
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

function lineNumberAt(source: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

function resolveSpecifier(spec: string, fromFile: string): string | null {
  if (!spec.startsWith('.') && !spec.startsWith('@/')) return null;

  let absPath: string;
  if (spec.startsWith('@/')) {
    absPath = `${PATHS.src}/${spec.slice(2)}`;
  } else {
    const fromDir = fromFile.substring(0, fromFile.lastIndexOf('/'));
    absPath = resolvePath(fromDir, spec);
  }
  return stripExt(absPath);
}

function resolvePath(baseDir: string, rel: string): string {
  const baseParts = baseDir.split('/').filter(Boolean);
  for (const part of rel.split('/')) {
    if (part === '..') baseParts.pop();
    else if (part !== '.') baseParts.push(part);
  }
  return '/' + baseParts.join('/');
}

function stripExt(path: string): string {
  if (path.endsWith('.tsx')) return path.slice(0, -4);
  if (path.endsWith('.ts')) return path.slice(0, -3);
  return path;
}

/** Tarjan's strongly connected components. */
function findCycles(nodes: string[], edges: Edge[]): string[][] {
  const adj = new Map<string, string[]>();
  for (const n of nodes) adj.set(n, []);
  for (const e of edges) {
    if (adj.has(e.from) && adj.has(e.to)) adj.get(e.from)!.push(e.to);
  }

  let index = 0;
  const indices = new Map<string, number>();
  const lowlink = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const sccs: string[][] = [];

  function strongconnect(v: string): void {
    indices.set(v, index);
    lowlink.set(v, index);
    index += 1;
    stack.push(v);
    onStack.add(v);

    for (const w of adj.get(v) ?? []) {
      if (!indices.has(w)) {
        strongconnect(w);
        lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
      } else if (onStack.has(w)) {
        lowlink.set(v, Math.min(lowlink.get(v)!, indices.get(w)!));
      }
    }

    if (lowlink.get(v) === indices.get(v)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.push(w);
      } while (w !== v);
      if (scc.length > 1) sccs.push(scc.reverse());
    }
  }

  for (const n of nodes) {
    if (!indices.has(n)) strongconnect(n);
  }
  return sccs;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const files = await walkFiles(PATHS.root, {
    extensions: ['.ts', '.tsx'],
    skipDirs: ['node_modules', '.git', 'dist', 'coverage', '.vite', 'reports'],
  });

  const projectFiles = files
    .filter((f) => {
      const rel = relative(PATHS.root, f).split('\\').join('/');
      return (
        (rel.startsWith('src/') || rel.startsWith('scripts/')) &&
        !rel.endsWith('.test.ts') &&
        !rel.endsWith('.test.tsx')
      );
    })
    .map((f) => stripExt('/' + relative(PATHS.root, f).split('\\').join('/')));

  const fileSet = new Set(projectFiles);
  const edges: Edge[] = [];

  for (const file of files) {
    const relPath = relative(PATHS.root, file).split('\\').join('/');
    if (!fileSet.has(stripExt('/' + relPath))) continue;
    const source = await readText(file);
    const imports = extractImportSpecifiers(source);
    const from = stripExt('/' + relPath);
    for (const imp of imports) {
      const to = resolveSpecifier(imp.spec, '/' + relPath);
      if (to === null) continue;
      if (!fileSet.has(to)) continue;
      edges.push({ from, to, line: imp.line });
    }
  }

  const cycles = findCycles(projectFiles, edges);
  for (const cycle of cycles) {
    violations.push(
      error(
        'circular-dependency',
        `Cycle detected: ${cycle.map((p) => p.replace(/^\//, '')).join(' -> ')}`,
        {
          file: cycle[0].replace(/^\//, ''),
          hint: 'Break the cycle by extracting shared code or inverting one dependency.',
        },
      ),
    );
  }

  return violations;
}
