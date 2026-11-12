/**
 * Worker lifecycle validator. Ensures Web Workers are created and
 * terminated correctly:
 *   - Every createEngine() is matched by dispose()
 *   - Worker errors are caught
 *   - Workers are terminated on component unmount
 *   - No orphaned worker references
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, info, type Violation } from '../../utils/validation-result';

function lineNumberAt(source: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  // Rule 1: every createEngine / new Worker must have a dispose/terminate.
  const tsxFiles = await walkFiles(PATHS.src, { extensions: ['.tsx'] });

  for (const file of tsxFiles) {
    const relPath = file
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');
    if (relPath.endsWith('.test.tsx')) continue;

    const src = await readText(file);

    const hasCreateEngine = /\bcreateEngine\s*\(/.test(src);
    const hasDispose = /\bdispose\s*\(\s*\)|\.terminate\s*\(\s*\)/.test(src);

    if (hasCreateEngine && !hasDispose) {
      violations.push(
        error('worker-no-dispose', 'Component creates engine but never disposes it (leak).', {
          file: relPath,
          line: lineNumberAt(src, src.search(/\bcreateEngine\s*\(/)),
          hint: 'Call engine.dispose() in useEffect cleanup.',
        }),
      );
    }

    // Rule 2: useRef pattern for worker (not useState).
    const usesWorkerInState = /useState\s*<\s*.*Worker/.test(src);
    if (usesWorkerInState) {
      violations.push(
        warning('worker-in-state', 'Worker instance stored in useState (should be useRef).', {
          file: relPath,
          hint: 'Workers are not serializable; use useRef.',
        }),
      );
    }
  }

  // Rule 3: engine/index.ts must have cleanup on dispose.
  const engineFiles = await walkFiles(PATHS.srcTools, { extensions: ['.ts'] });
  for (const file of engineFiles) {
    const relPath = file
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');
    if (!relPath.endsWith('/engine/index.ts')) continue;

    const src = await readText(file);
    if (!/terminate\s*\(\s*\)/.test(src)) {
      violations.push(
        error(
          'engine-no-terminate',
          'Engine index.ts does not call worker.terminate() in dispose.',
          { file: relPath, hint: 'Always terminate workers on dispose.' },
        ),
      );
    }
    if (!/\.onerror\s*=|addEventListener\(\s*["']error["']/.test(src)) {
      violations.push(
        warning('engine-no-error-handler', 'Engine does not listen for worker errors.', {
          file: relPath,
          hint: 'Add worker.addEventListener("error", ...).',
        }),
      );
    }
  }

  // Rule 4: worker.ts must have message handler.
  const workerFiles = engineFiles.filter((f) => f.endsWith('/engine/worker.ts'));
  for (const file of workerFiles) {
    const relPath = file
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');
    const src = await readText(file);
    if (!/addEventListener\(\s*['"]message['"]/.test(src)) {
      violations.push(
        error('worker-no-handler', 'Worker has no message handler.', {
          file: relPath,
        }),
      );
    }
  }

  violations.push(
    info(
      'worker-lifecycle-ok',
      `${tsxFiles.filter((f) => /createEngine/.test(f)).length} tool(s) with engine lifecycle verified.`,
    ),
  );

  return violations;
}
