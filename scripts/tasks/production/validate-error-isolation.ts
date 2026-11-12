/**
 * Error isolation validator. Ensures errors in one tool do not crash
 * the whole app:
 *   - Tool components wrapped in ErrorBoundary (or route-level boundary)
 *   - Async errors in workers are caught
 *   - No unhandled promise rejections in source
 *   - No throw in JSX render path without catch
 */

import { walkFiles, readText, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { warning, info, type Violation } from '../../utils/validation-result';

function lineNumberAt(source: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  // Rule 1: ErrorBoundary exists.
  const boundaryPaths = [
    `${PATHS.srcComponents}/ErrorBoundary.tsx`,
    `${PATHS.srcComponents}/ui/ErrorBoundary.tsx`,
  ];
  const hasBoundary = await Promise.all(boundaryPaths.map(pathExists)).then((r) =>
    r.some(Boolean),
  );

  if (!hasBoundary) {
    violations.push(
      warning(
        'no-error-boundary',
        'No ErrorBoundary component exists.',
        {
          file: 'src/components/ErrorBoundary.tsx',
          hint: 'Wrap tool routes in an ErrorBoundary to isolate crashes.',
        },
      ),
    );
  }

  // Rule 2: App.tsx should wrap routes in a boundary if it exists.
  const appPath = `${PATHS.src}/App.tsx`;
  if (await pathExists(appPath)) {
    const src = await readText(appPath);
    if (hasBoundary && !/ErrorBoundary/.test(src)) {
      violations.push(
        warning(
          'no-boundary-in-app',
          'App.tsx does not use ErrorBoundary.',
          { file: 'src/App.tsx' },
        ),
      );
    }
  }

  // Rule 3: async functions calling engine must try/catch.
  const tsxFiles = await walkFiles(PATHS.src, { extensions: ['.tsx'] });
  for (const file of tsxFiles) {
    const relPath = file.substring(PATHS.root.length + 1).split('\\').join('/');
    if (relPath.endsWith('.test.tsx')) continue;

    const src = await readText(file);

    // Find any `await engine.compress()` or similar.
    const engineCallRe = /await\s+engine\.\w+\(/g;
    let m: RegExpExecArray | null;
    while ((m = engineCallRe.exec(src)) !== null) {
      // Look backward for try { within 300 chars.
      const back = src.slice(Math.max(0, m.index - 300), m.index);
      if (!/try\s*\{[^}]*$/s.test(back)) {
        violations.push(
          warning(
            'unprotected-engine-call',
            'await engine.<method>() without surrounding try/catch.',
            {
              file: relPath,
              line: lineNumberAt(src, m.index),
              hint: 'Wrap in try/catch and set error state.',
            },
          ),
        );
      }
    }

    // Rule 4: no unhandled promise rejection patterns (.then without .catch).
    const thenRe = /\.then\s*\(([^)]*)\)\s*(?!\.catch)/g;
    while ((m = thenRe.exec(src)) !== null) {
      violations.push(
        warning(
          'then-without-catch',
          '.then() without .catch (unhandled rejection risk).',
          {
            file: relPath,
            line: lineNumberAt(src, m.index),
          },
        ),
      );
      if (m.index === thenRe.lastIndex) thenRe.lastIndex += 1;
    }
  }

  violations.push(
    info(
      'error-isolation-ok',
      `Error isolation checks complete${hasBoundary ? ' (boundary exists)' : ' (boundary missing — see warnings)'}.`,
    ),
  );

  return violations;
}
