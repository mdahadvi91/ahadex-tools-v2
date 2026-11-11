/**
 * Dependency graph validator. Ensures:
 *   - GROUP_DEPENDENCIES has no cycles.
 *   - Every group listed in GROUP_DEPENDENCIES exists in the task registry.
 *   - Every group in the task registry exists in GROUP_DEPENDENCIES.
 *   - Every imported package is declared in package.json.
 *   - No platform module imports an undeclared package.
 *
 * Reads scripts/registry/tasks.ts as text to avoid a circular import.
 */

import { readText, readJson, walkFiles, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';
import { GROUP_DEPENDENCIES, listGroups } from '../../registry/dependencies';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const NODE_BUILTINS = new Set([
  'fs', 'path', 'os', 'crypto', 'http', 'https', 'url', 'util', 'stream',
  'events', 'child_process', 'buffer', 'assert', 'zlib', 'worker_threads',
  'perf_hooks', 'module', 'process', 'readline', 'net', 'dns', 'tls',
  'string_decoder', 'querystring', 'punycode', 'timers', 'vm', 'v8',
]);

const CLI_ONLY = new Set([
  'typescript', 'eslint', 'prettier', 'vitest', 'tsx', 'vite',
  '@vitejs/plugin-react', '@tailwindcss/postcss', '@eslint/js',
  'typescript-eslint', 'eslint-config-prettier', 'eslint-plugin-react-hooks',
  'globals', 'postcss', 'autoprefixer', 'tailwindcss',
  '@types/node', '@types/react', '@types/react-dom',
  'playwright', '@playwright/test', '@vitest/ui',
]);

function isNodeBuiltin(spec: string): boolean {
  if (spec.startsWith('node:')) return true;
  const root = spec.split('/')[0];
  return NODE_BUILTINS.has(root);
}

/** Strips line and block comments from source text before scanning. */
function stripComments(source: string): string {
  let out = '';
  let i = 0;
  let inString: string | null = null;
  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];

    if (inString !== null) {
      out += c;
      if (c === '\\' && i + 1 < source.length) {
        out += source[i + 1];
        i += 2;
        continue;
      }
      if (c === inString) inString = null;
      i++;
      continue;
    }

    if (c === '"' || c === "'" || c === '`') {
      inString = c;
      out += c;
      i++;
      continue;
    }

    if (c === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && next === '*') {
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i++;
      i += 2;
      continue;
    }

    out += c;
    i++;
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

/** Extracts bare module specifiers from import/export statements. */
function extractBareImports(
  source: string,
): Array<{ spec: string; line: number }> {
  const clean = stripComments(source);
  const out: Array<{ spec: string; line: number }> = [];
  const re = /\b(?:import|from)\s+(?:type\s+)?[^'"]*?from\s+['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean)) !== null) {
    const spec = m[1];
    if (spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('@/')) {
      continue;
    }
    out.push({ spec, line: lineNumberAt(clean, m.index) });
  }
  return out;
}

function rootPackageOf(spec: string): string {
  if (spec.startsWith('@')) {
    const parts = spec.split('/');
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : spec;
  }
  return spec.split('/')[0];
}

/** Extracts group names from tasks.ts text without importing the module. */
function extractRegisteredGroups(tasksSource: string): Set<string> {
  const groups = new Set<string>();
  const re = /^\s{2}([a-z][a-z0-9]*):\s*\{/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tasksSource)) !== null) {
    groups.add(m[1]);
  }
  return groups;
}

/** Detects group cycles in the dependency graph. */
function findGroupCycles(
  deps: Record<string, readonly string[]>,
): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const stack: string[] = [];

  function visit(node: string): void {
    if (visited.has(node)) return;
    if (stack.includes(node)) {
      const start = stack.indexOf(node);
      cycles.push([...stack.slice(start), node]);
      return;
    }
    stack.push(node);
    for (const child of deps[node] ?? []) {
      visit(child);
    }
    stack.pop();
    visited.add(node);
  }

  for (const node of Object.keys(deps)) visit(node);
  return cycles;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  // Rule 1: group dependency graph must be acyclic.
  const cycles = findGroupCycles(
    GROUP_DEPENDENCIES as Record<string, readonly string[]>,
  );
  for (const cycle of cycles) {
    violations.push(
      error('group-cycle', `Group dependency cycle: ${cycle.join(' -> ')}`, {
        file: 'scripts/registry/dependencies.ts',
        hint: 'Break the cycle by removing one edge.',
      }),
    );
  }

  // Rule 2: cross-check group declarations vs. registered groups.
  // Read tasks.ts as text to avoid a runtime circular dependency.
  const tasksTsPath = `${PATHS.scripts}/registry/tasks.ts`;
  const declaredGroups = new Set<string>(listGroups());
  const registeredGroups = new Set<string>();
  if (await pathExists(tasksTsPath)) {
    const tasksSource = await readText(tasksTsPath);
    for (const g of extractRegisteredGroups(tasksSource)) registeredGroups.add(g);
  }

  for (const g of declaredGroups) {
    if (!registeredGroups.has(g)) {
      violations.push(
        error(
          'dep-group-not-registered',
          `Group "${g}" is declared in GROUP_DEPENDENCIES but not in TASKS.`,
          { file: 'scripts/registry/dependencies.ts' },
        ),
      );
    }
  }
  for (const g of registeredGroups) {
    if (!declaredGroups.has(g)) {
      violations.push(
        error(
          'registered-group-not-declared',
          `Group "${g}" is registered in TASKS but missing from GROUP_DEPENDENCIES.`,
          { file: 'scripts/registry/tasks.ts' },
        ),
      );
    }
  }

  // Rule 3: every dependency child references an existing group.
  for (const [group, children] of Object.entries(GROUP_DEPENDENCIES)) {
    for (const child of children) {
      if (!declaredGroups.has(child)) {
        violations.push(
          error(
            'dep-unknown-group',
            `Group "${group}" depends on unknown group "${child}".`,
            { file: 'scripts/registry/dependencies.ts' },
          ),
        );
      }
    }
  }

  // Rule 4: package.json declared packages must be importable in code.
  const pkg = await readJson<PackageJson>(PATHS.packageJson);
  const allDeclared = new Set<string>([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ]);

  const sourceFiles = await walkFiles(PATHS.root, {
    extensions: ['.ts', '.tsx'],
    skipDirs: ['node_modules', '.git', 'dist', 'coverage', '.vite', 'reports'],
  });

  const usedPackages = new Map<string, string>();
  for (const file of sourceFiles) {
    const rel = file.substring(PATHS.root.length + 1).split('\\').join('/');
    if (!rel.startsWith('src/') && !rel.startsWith('scripts/')) continue;
    if (rel.endsWith('.test.ts') || rel.endsWith('.test.tsx')) continue;

    const source = await readText(file);
    for (const imp of extractBareImports(source)) {
      if (isNodeBuiltin(imp.spec)) continue;
      const root = rootPackageOf(imp.spec);
      if (!usedPackages.has(root)) usedPackages.set(root, rel);
    }
  }

  for (const [pkgName, file] of usedPackages) {
    if (!allDeclared.has(pkgName)) {
      violations.push(
        error(
          'undeclared-package',
          `Package "${pkgName}" is imported but not declared in package.json.`,
          {
            file,
            hint: `Add "${pkgName}" to dependencies or devDependencies.`,
          },
        ),
      );
    }
  }

  // Rule 5: warn about declared packages that are never imported
  // (excluding CLI-only toolchain and @types/* packages).
  for (const declaredPkg of allDeclared) {
    if (usedPackages.has(declaredPkg)) continue;
    if (CLI_ONLY.has(declaredPkg)) continue;
    if (declaredPkg.startsWith('@types/')) continue;
    violations.push(
      warning(
        'unused-declared-package',
        `Package "${declaredPkg}" is declared but not imported anywhere.`,
        {
          file: 'package.json',
          hint: 'Remove it if unused, or confirm it is a transitive requirement.',
        },
      ),
    );
  }

  return violations;
}
