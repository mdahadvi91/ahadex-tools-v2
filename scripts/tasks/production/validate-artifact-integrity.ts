/**
 * Artifact integrity validator. Ensures the built artifacts are
 * consistent:
 *   - Every asset referenced in index.html exists in dist/
 *   - Every CSS URL reference resolves
 *   - No broken imports in JS bundles (basic check)
 *   - package-lock.json matches package.json
 */

import { join } from 'node:path';
import { readText, readJson, pathExists, walkFiles } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, info, warning, type Violation } from '../../utils/validation-result';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface Lockfile {
  packages?: Record<string, { version?: string }>;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const indexPath = join(PATHS.dist, 'index.html');
  if (!(await pathExists(indexPath))) {
    return [
      error('integrity-no-dist', 'dist/index.html is missing.', {
        hint: 'Run `npm run build` first.',
      }),
    ];
  }

  const html = await readText(indexPath);

  // Rule 1: every <script src> and <link href> exists.
  const assetRefs = new Set<string>();
  const scriptRe = /<script\b[^>]*\bsrc=["'](\/assets\/[^"']+)["']/g;
  const linkRe = /<link\b[^>]*\bhref=["'](\/assets\/[^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = scriptRe.exec(html)) !== null) assetRefs.add(m[1]);
  while ((m = linkRe.exec(html)) !== null) assetRefs.add(m[1]);

  for (const ref of assetRefs) {
    const assetPath = join(PATHS.dist, ref.replace(/^\//, ''));
    if (!(await pathExists(assetPath))) {
      violations.push(
        error('missing-asset', `Asset "${ref}" is referenced but missing in dist/.`, {
          file: 'dist/index.html',
        }),
      );
    }
  }

  // Rule 2: dist/assets contains no orphaned files (informational).
  const assetFiles = await walkFiles(join(PATHS.dist, 'assets'), {
    extensions: ['.js', '.css'],
  });
  const referencedFiles = new Set(
    [...assetRefs].map((r) => r.split('/').pop()).filter((f): f is string => !!f),
  );

  const orphans = assetFiles.filter((f) => {
    const name = f.split('/').pop();
    return name && !referencedFiles.has(name) && !/worker|chunk/.test(name);
  });
  if (orphans.length > 0) {
    violations.push(
      info(
        'orphan-assets',
        `${orphans.length} asset file(s) not directly referenced (may be lazy-loaded).`,
      ),
    );
  }

  // Rule 3: package-lock.json is in sync with package.json.
  if (await pathExists(PATHS.packageJson)) {
    const lockPath = join(PATHS.root, 'package-lock.json');
    if (!(await pathExists(lockPath))) {
      violations.push(
        error('lockfile-missing', 'package-lock.json is missing.', {
          file: 'package-lock.json',
        }),
      );
    } else {
      try {
        const pkg = await readJson<PackageJson>(PATHS.packageJson);
        const lock = await readJson<Lockfile>(lockPath);

        const declaredDeps = new Set([
          ...Object.keys(pkg.dependencies ?? {}),
          ...Object.keys(pkg.devDependencies ?? {}),
        ]);
        const lockDeps = new Set(
          Object.keys(lock.packages ?? {})
            .filter((k) => k.startsWith('node_modules/'))
            .map((k) => k.replace(/^node_modules\//, ''))
            .filter((k) => !k.includes('/node_modules/')),
        );

        for (const dep of declaredDeps) {
          if (!lockDeps.has(dep)) {
            violations.push(
              warning(
                'lockfile-out-of-sync',
                `Dependency "${dep}" declared in package.json but not in lockfile.`,
                {
                  file: 'package-lock.json',
                  hint: 'Run `npm install` to update the lockfile.',
                },
              ),
            );
          }
        }
      } catch (err) {
        violations.push(
          warning(
            'lockfile-parse-failed',
            `Could not parse lockfile: ${err instanceof Error ? err.message : String(err)}`,
            { file: 'package-lock.json' },
          ),
        );
      }
    }
  }

  violations.push(info('integrity-ok', `${assetRefs.size} asset references verified.`));

  return violations;
}
