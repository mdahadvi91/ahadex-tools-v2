/**
 * Dependency graph validator. Ensures:
 *   - GROUP_DEPENDENCIES has no cycles.
 *   - Every group listed in GROUP_DEPENDENCIES exists in TASKS.
 *   - Every group in TASKS exists in GROUP_DEPENDENCIES.
 *   - Every imported package in package.json is actually used.
 *   - No platform module imports a package not declared in package.json.
 */

import { readText, readJson, walkFiles } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';
import { GROUP_DEPENDENCIES, listGroups } from '../../registry/dependencies';
import { TASKS } from '../../registry/tasks';
import type { GroupName } from '../../registry/task-types';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

/**
 * Groups whose dependency edges form a cycle. Returned as an ordered
 * path: A -> B -> C -> A.
 */
function findGroupCycles(deps: Record<string, readonly string[]>): string[][] {
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

  for (const node of Object.keys(deps)) {
    visit(node);
  }
  return cycles;
}

function lineNumberAt(source: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

/** Extracts bare module specifiers from import statements. */
function extractBareImports(source: string): Array<{ spec: string; line: number }> {
  const out: Array<{ spec: string; line: number }> = [];
  const re = /\b(?:import|from)\s+(?:type\s+)?[^'"]*?from\s+['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    if (!m[1].startsWith('.') && !m[1].startsWith('/')) {
      out.push({ spec: m[1], line: lineNumberAt(source, m.index) });
    }
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

const NODE_BUILTINS = new Set([
  'fs', 'path', 'os', 'crypto', 'http', 'https', 'url', 'util', 'stream',
  'events', 'child_process', 'buffer', 'assert', 'zlib', 'worker_threads',
  'perf_hooks', 'node:fs', 'node:path', 'node:os', 'node:crypto',
  'node:http', 'node:https', 'node:url', 'node:util', 'node:stream',
  'node:events', 'node:child_process', 'node:buffer', 'node:assert',
  'node:zlib', 'node:worker_threads', 'node:perf_hooks', 'node:module',
  'node:process', 'node:readline',
]);

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  // Rule 1: group dependency graph must be acyclic.
  const cycles = findGroupCycles(GROUP_DEPENDENCIES as Record<string, readonly string[]>);
  for (const cycle of cycles) {
    violations.push(
      error(
        'group-cycle',
        `Group dependency cycle: ${cycle.join(' -> ')}`,
        {
          file: 'scripts/registry/dependencies.ts',
          hint: 'Break the cycle by removing one edge.',
        },
      ),
    );
  }

  // Rule 2: every declared group exists in TASKS and vice versa.
  const declared = new Set(listGroups());
  const registered = new Set(Object.keys(TASKS) as GroupName[]);

  for (const group of declared) {
    if (!registered.has(group)) {
      violations.push(
        error(
          'dep-group-not-registered',
          `Group "${group}" is declared in GROUP_DEPENDENCIES but not in TASKS.`,
          { file: 'scripts/registry/dependencies.ts' },
        ),
      );
    }
  }

  for (const group of registered) {
    if (!declared.has(group)) {
      violations.push(
        error(
          'registered-group-not-declared',
          `Group "${group}" is registered in TASKS but missing from GROUP_DEPENDENCIES.`,
          { file: 'scripts/registry/tasks.ts' },
        ),
      );
    }
  }

  // Rule 3: every dependency child references an existing group.
  for (const [group, children] of Object.entries(GROUP_DEPENDENCIES)) {
    for (const child of children) {
      if (!declared.has(child)) {
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

  // Rule 4: package.json declared packages must be importable in the codebase.
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
    const imports = extractBareImports(source);
    for (const imp of imports) {
      if (NODE_BUILTINS.has(imp.spec)) continue;
      const root = rootPackageOf(imp.spec);
      if (!usedPackages.has(root)) {
        usedPackages.set(root, rel);
      }
    }
  }

  // Rule 5: every imported package (except node built-ins) must be declared.
  // Relative-path imports are ignored by extractBareImports.
  // Alias `@/` is project-internal; skip it.
  for (const [pkgName, file] of usedPackages) {
    if (pkgName === '@' || pkgName.startsWith('@/')) continue;
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

  // Rule 6: warn about declared packages that are never imported.
  // Skip toolchain packages that are consumed by CLI invocation rather
  // than import (they show up as scripts in package.json).
  const CLI_ONLY = new Set([
    'typescript', 'eslint', 'prettier', 'vitest', 'tsx', 'vite',
    '@vitejs/plugin-react', '@tailwindcss/postcss', '@eslint/js',
    'typescript-eslint', 'eslint-config-prettier', 'eslint-plugin-react-hooks',
    'globals', 'postcss', 'autoprefixer', 'tailwindcss',
    '@types/node', '@types/react', '@types/react-dom',
    'playwright', '@playwright/test', '@vitest/ui',
  ]);

  for (const declaredPkg of allDeclared) {
    if (usedPackages.has(declaredPkg)) continue;
    if (CLI_ONLY.has(declaredPkg)) continue;
    // Skip packages that exist only as scoped variants of used packages.
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
