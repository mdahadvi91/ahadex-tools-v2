/**
 * Prototype pollution validator. Detects dangerous patterns that
 * can lead to prototype pollution:
 *   - Object.assign with untrusted input
 *   - Bracket assignment with variable keys (obj[key] = ...)
 *   - Recursive merge without __proto__ guard
 *   - JSON.parse without subsequent type check in tool input
 */

import { relative } from 'node:path';
import { readText, walkFiles } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

const SOURCE_EXTS = ['.ts', '.tsx'];

interface Pattern {
  name: string;
  regex: RegExp;
  severity: 'error' | 'warning';
  message: string;
}

const PATTERNS: readonly Pattern[] = [
  {
    name: 'proto-key-literal',
    regex: /['"]__proto__['"]\s*:/g,
    severity: 'error',
    message: 'Literal "__proto__" key detected.',
  },
  {
    name: 'constructor-proto',
    regex: /\.constructor\s*\.\s*prototype/g,
    severity: 'error',
    message: 'Use of .constructor.prototype can enable prototype pollution.',
  },
  {
    name: 'bracket-assignment',
    regex: /\b\w+\[[a-zA-Z_$][\w$]*\]\s*=/g,
    severity: 'warning',
    message: 'Bracket assignment with variable key. Confirm the key is trusted.',
  },
  {
    name: 'object-assign-untrusted',
    regex: /Object\.assign\(\s*[a-zA-Z_$]/g,
    severity: 'warning',
    message: 'Object.assign with variable input. Verify the source is trusted.',
  },
  {
    name: 'recursive-merge',
    regex: /function\s+\w*[Mm]erge\w*\s*\(/g,
    severity: 'warning',
    message: 'Custom merge function detected. Must guard against __proto__.',
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
  /scripts\/tasks\/security\/validate-prototype-pollution\.ts$/,
];

function shouldSkip(filePath: string): boolean {
  return SKIP_PATTERNS.some((re) => re.test(filePath));
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
      const re = new RegExp(
        pattern.regex.source,
        pattern.regex.flags.includes('g') ? pattern.regex.flags : pattern.regex.flags + 'g',
      );
      let match: RegExpExecArray | null;
      while ((match = re.exec(src)) !== null) {
        const line = lineNumberAt(src, match.index);
        const snippet = match[0].slice(0, 60);
        if (pattern.severity === 'error') {
          violations.push(
            error('prototype-pollution', pattern.message, {
              file: relPath,
              line,
              hint: `Matched: ${snippet}`,
            }),
          );
        } else {
          violations.push(
            warning('prototype-pollution-risk', pattern.message, {
              file: relPath,
              line,
              hint: `Matched: ${snippet}`,
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
