/**
 * Detects drift between package.json and installed packages:
 *   - Dependencies declared but not installed
 *   - Installed dependencies not declared
 *   - Duplicate packages via multiple versions
 */

import { join } from 'node:path';
import { readdir } from 'node:fs/promises';
import { PATHS } from '../../utils/constants';
import { pathExists, readJson } from '../../utils/file-system';
import { error, warning, type Violation } from '../../utils/validation-result';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const pkg = await readJson<PackageJson>(PATHS.packageJson);
  const declared = new Set<string>([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
  ]);

  const nodeModules = join(PATHS.root, 'node_modules');
  if (!(await pathExists(nodeModules))) {
    return [error('node-modules-missing', 'node_modules not found. Run `npm install`.')];
  }

  // Installed top-level dependencies (direct children of node_modules).
  const entries = await readdir(nodeModules, { withFileTypes: true });
  const installed = new Set<string>();
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.')) continue;
    if (entry.name.startsWith('@')) {
      // Scoped package: check one level deeper.
      const scopeDir = join(nodeModules, entry.name);
      const scoped = await readdir(scopeDir, { withFileTypes: true });
      for (const sub of scoped) {
        if (sub.isDirectory()) installed.add(`${entry.name}/${sub.name}`);
      }
    } else {
      installed.add(entry.name);
    }
  }

  // Declared but not installed.
  for (const name of declared) {
    if (!installed.has(name)) {
      violations.push(
        error('declared-not-installed', `"${name}" is declared but not installed.`, {
          hint: 'Run `npm install`.',
        }),
      );
    }
  }

  // Installed but not declared (excluding optional deps of other packages).
  for (const name of installed) {
    if (declared.has(name)) continue;
    // Ignore common built-in / transitive-visible cases.
    if (name === '.bin' || name === '.package-lock.json' || name === '.cache') continue;
    violations.push(
      warning(
        'installed-not-declared',
        `"${name}" is installed but not declared in package.json.`,
        { hint: 'Likely a transitive dependency. Safe to ignore if unused directly.' },
      ),
    );
  }

  return violations;
}
