/**
 * Resource exhaustion validator. Detects patterns that can crash
 * the browser:
 *   - Unbounded loops on user input
 *   - Memory allocation in loops without limits
 *   - Missing size checks before processing
 *   - Synchronous heavy operations on the main thread
 */

import { relative } from 'node:path';
import { readText, walkFiles, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

const SOURCE_EXTS = ['.ts', '.tsx'];

interface Pattern {
  name: string;
  regex: RegExp;
  severity: 'error' | 'warning';
  message: string;
  hint: string;
}

const PATTERNS: readonly Pattern[] = [
  {
    name: 'unbounded-loop',
    regex: /while\s*\(\s*true\s*\)/g,
    severity: 'error',
    message: 'Infinite loop without break on user input can hang the browser.',
    hint: 'Add an iteration cap or a termination condition.',
  },
  {
    name: 'array-from-large',
    regex: /Array\.from\(\s*\{\s*length\s*:\s*[a-zA-Z_$]/g,
    severity: 'warning',
    message: 'Array.from on variable length. Confirm the length is bounded.',
    hint: 'Cap the length before constructing the array.',
  },
  {
    name: 'new-array-large',
    regex: /new\s+Array\(\s*[a-zA-Z_$][\w$]*\s*\)/g,
    severity: 'warning',
    message: 'new Array with variable length. Confirm the length is bounded.',
    hint: 'Cap the length before allocation.',
  },
  {
    name: 'set-interval-no-clear',
    regex: /setInterval\(/g,
    severity: 'warning',
    message: 'setInterval without clearInterval leaks resources.',
    hint: 'Track the interval id and clear it on cleanup.',
  },
  {
    name: 'sync-file-read-large',
    regex: /readFileSync\(/g,
    severity: 'warning',
    message: 'Synchronous file read on the main thread blocks the UI.',
    hint: 'Use async readFile or Web Worker for large files.',
  },
];

function lineNumberAt(source: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

const SKIP_PATTERNS = [
  /\/node_modules\//,
  /\/dist\//,
  /\/reports\//,
  /\.min\.js$/,
  /scripts\/tasks\/security\/validate-resource-exhaustion\.ts$/,
];

function shouldSkip(filePath: string): boolean {
  return SKIP_PATTERNS.some((re) => re.test(filePath));
}

/** Check that tool engines have size guards before processing. */
async function checkToolGuards(): Promise<Violation[]> {
  const violations: Violation[] = [];
  if (!(await pathExists(PATHS.srcTools))) return violations;

  const files = await walkFiles(PATHS.srcTools, { extensions: ['.ts', '.tsx'] });
  const tools = new Set<string>();
  for (const f of files) {
    const m = f.match(/src\/tools\/([^/]+)\//);
    if (m) tools.add(m[1]);
  }

  for (const slug of tools) {
    const toolFiles = files.filter((f) => f.includes(`/tools/${slug}/`));
    let hasGuard = false;
    for (const f of toolFiles) {
      const src = await readText(f);
      if (/validateSingleFile|validateBatch|file-policy/.test(src)) {
        hasGuard = true;
        break;
      }
    }
    if (!hasGuard && toolFiles.some((f) => !f.endsWith('.test.ts'))) {
      violations.push(
        error(
          'tool-missing-size-guard',
          `Tool "${slug}" has no file-policy validation.`,
          {
            hint: 'Call validateSingleFile or validateBatch before processing.',
          },
        ),
      );
    }
  }

  return violations;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const files = await walkFiles(PATHS.root, {
    extensions: SOURCE_EXTS,
    skipDirs: ['node_modules', '.git', 'dist', 'coverage', '.vite', 'reports'],
  });

  for (const file of files) {
    if (shouldSkip(file)) continue;
    const src = await readText(file);
    const relPath = relative(PATHS.root, file).split('\\').join('/');

    for (const pattern of PATTERNS) {
      const re = new RegExp(pattern.regex.source, pattern.regex.flags);
      let match: RegExpExecArray | null;
      while ((match = re.exec(src)) !== null) {
        const line = lineNumberAt(src, match.index);
        if (pattern.severity === 'error') {
          violations.push(
            error('resource-exhaustion', pattern.message, {
              file: relPath,
              line,
              hint: pattern.hint,
            }),
          );
        } else {
          violations.push(
            warning('resource-exhaustion-risk', pattern.message, {
              file: relPath,
              line,
              hint: pattern.hint,
            }),
          );
        }
        if (match.index === re.lastIndex) re.lastIndex += 1;
        break;
      }
    }
  }

  const guardViolations = await checkToolGuards();
  violations.push(...guardViolations);

  return violations;
}
