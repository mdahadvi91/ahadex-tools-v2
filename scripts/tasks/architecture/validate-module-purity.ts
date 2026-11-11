/**
 * Module purity validator. Detects side effects at module load time
 * and impure config modules:
 *   - Top-level await, top-level process.exit
 *   - Top-level fetch / XMLHttpRequest
 *   - Top-level document/window access in pure platform modules
 *   - Mutable module-level state in config modules
 *   - console.log outside scripts/ and logger modules
 *
 * Config and platform utility modules are held to a stricter standard
 * than pages, components, or the entry point.
 */

import { relative } from 'node:path';
import { readText, walkFiles } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

const STRICT_MODULE_PREFIXES = ['src/config/', 'src/platform/utilities/', 'src/platform/seo/'];

/** Strips function bodies so we only match top-level statements. */
function stripFunctionBodies(source: string): string {
  let out = '';
  let i = 0;
  let depth = 0;
  let inString: string | null = null;
  while (i < source.length) {
    const c = source[i];

    if (inString !== null) {
      if (depth === 0) out += c;
      if (c === '\\\\' && i + 1 < source.length) {
        i++;
        if (depth === 0) out += source[i];
        continue;
      }
      if (c === inString) inString = null;
      i++;
      continue;
    }

    if (c === '"' || c === "'" || c === '`') {
      inString = c;
      if (depth === 0) out += c;
      i++;
      continue;
    }

    if (c === '{') depth++;
    else if (c === '}') {
      depth = Math.max(0, depth - 1);
      if (depth === 0) out += '\n';
      i++;
      continue;
    }

    if (depth === 0) out += c;
    i++;
  }
  return out;
}

function isStrictModule(relPath: string): boolean {
  return STRICT_MODULE_PREFIXES.some((p) => relPath.startsWith(p));
}

function lineNumberAt(source: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

interface ImpurePattern {
  name: string;
  regex: RegExp;
  severity: 'error' | 'warning';
  message: string;
  applies: 'all' | 'strict';
}

const PATTERNS: readonly ImpurePattern[] = [
  {
    name: 'top-level-await',
    regex: /^\s*(?:const|let|var|export\s+const|export\s+let)\s+[^=]+=\s*await\s+/gm,
    severity: 'error',
    message: 'Top-level await makes module loading asynchronous and impure.',
    applies: 'all',
  },
  {
    name: 'top-level-process-exit',
    regex: /^process\.exit\(/gm,
    severity: 'error',
    message: 'process.exit at module top level kills the runtime.',
    applies: 'all',
  },
  {
    name: 'top-level-fetch',
    regex: /^\s*fetch\s*\(/gm,
    severity: 'error',
    message: 'Network call at module top level violates purity.',
    applies: 'strict',
  },
  {
    name: 'top-level-document',
    regex: /^document\./gm,
    severity: 'error',
    message: 'document access at module top level breaks SSR and testing.',
    applies: 'strict',
  },
  {
    name: 'top-level-window',
    regex: /^window\./gm,
    severity: 'error',
    message: 'window access at module top level breaks SSR and testing.',
    applies: 'strict',
  },
  {
    name: 'mutable-module-state',
    regex: /^(?:let|var)\s+[a-zA-Z_$][\w$]*\s*=/gm,
    severity: 'warning',
    message: 'Mutable module-level state in a config or utility module.',
    applies: 'strict',
  },
  {
    name: 'console-log',
    regex: /^\s*console\.log\s*\(/gm,
    severity: 'warning',
    message: 'console.log at module top level. Use logger instead.',
    applies: 'strict',
  },
];

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const files = await walkFiles(PATHS.root, {
    extensions: ['.ts', '.tsx'],
    skipDirs: ['node_modules', '.git', 'dist', 'coverage', '.vite', 'reports'],
  });

  for (const file of files) {
    const relPath = relative(PATHS.root, file).split('\\').join('/');
    if (!relPath.startsWith('src/')) continue;
    if (relPath.endsWith('.test.ts') || relPath.endsWith('.test.tsx')) continue;
    if (relPath === 'src/main.tsx') continue;

    const rawSource = await readText(file);
    const source = stripFunctionBodies(rawSource);
    const strict = isStrictModule(relPath);

    for (const pattern of PATTERNS) {
      if (pattern.applies === 'strict' && !strict) continue;
      const re = new RegExp(pattern.regex.source, pattern.regex.flags);
      let match: RegExpExecArray | null;
      while ((match = re.exec(source)) !== null) {
        const line = lineNumberAt(rawSource, match.index);
        if (pattern.severity === 'error') {
          violations.push(
            error('impure-module', pattern.message, {
              file: relPath,
              line,
              hint: `Matched: ${match[0].trim().slice(0, 60)}`,
            }),
          );
        } else {
          violations.push(
            warning('impure-module', pattern.message, {
              file: relPath,
              line,
              hint: `Matched: ${match[0].trim().slice(0, 60)}`,
            }),
          );
        }
        if (match.index === re.lastIndex) re.lastIndex += 1;
        break;
      }
    }
  }

  return violations;
}
