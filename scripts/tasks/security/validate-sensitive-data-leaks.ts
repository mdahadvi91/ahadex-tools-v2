/**
 * Sensitive data leak validator. Detects patterns where file content,
 * filenames, or user data can escape via network, logs, or storage:
 *   - fetch()/XHR with File/Blob bodies
 *   - console.log of File objects or file.name
 *   - localStorage/sessionStorage of file content
 *   - postMessage with file content to wildcard origin
 *   - analytics events containing file name or content
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
  hint: string;
}

const PATTERNS: readonly Pattern[] = [
  {
    name: 'fetch-with-file',
    regex: /fetch\([^)]*\b(?:file|blob|formData)\b/gi,
    severity: 'error',
    message: 'fetch() appears to send file content. Files must not leave the browser.',
    hint: 'If this is intentional, move it behind an ADR and gate it with consent.',
  },
  {
    name: 'xhr-send-file',
    regex: /\.send\(\s*(?:file|blob|formData)\b/gi,
    severity: 'error',
    message: 'XHR appears to send file content.',
    hint: 'Remove the network call; process locally.',
  },
  {
    name: 'console-log-filename',
    regex: /console\.(?:log|info|warn|error)\([^)]*\b(?:file\.name|fileName|filename)\b/g,
    severity: 'warning',
    message: 'Logging a filename can leak user data to the console.',
    hint: 'Remove or use a redacted label.',
  },
  {
    name: 'storage-with-file',
    regex: /(?:localStorage|sessionStorage)\.setItem\([^)]*\b(?:file|blob|content)\b/gi,
    severity: 'error',
    message: 'Storing file content in browser storage.',
    hint: 'Files must stay in memory only.',
  },
  {
    name: 'postmessage-wildcard',
    regex: /postMessage\([^)]*,\s*['"]\*['"]\s*\)/g,
    severity: 'error',
    message: 'postMessage with wildcard origin leaks data to any embedder.',
    hint: 'Specify an explicit target origin.',
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
  /scripts\/tasks\/security\/validate-sensitive-data-leaks\.ts$/,
];

function shouldSkip(filePath: string): boolean {
  return SKIP_PATTERNS.some((re) => re.test(filePath));
}

/** Verify analytics payloads never include file names or contents. */
async function checkAnalyticsPayloads(): Promise<Violation[]> {
  const violations: Violation[] = [];
  const { pathExists } = await import('../../utils/file-system');
  const analyticsDir = `${PATHS.srcPlatform}/analytics`;
  if (!(await pathExists(analyticsDir))) return violations;

  const files = await walkFiles(analyticsDir, { extensions: SOURCE_EXTS });
  for (const file of files) {
    if (file.endsWith('.test.ts')) continue;
    const src = await readText(file);
    const relPath = relative(PATHS.root, file).split('\\').join('/');

    const forbiddenKeys = ['file.name', 'fileName', 'filename', 'fileContent', 'content', 'blob', 'buffer'];
    for (const key of forbiddenKeys) {
      if (new RegExp(`['"]${key.replace('.', '\\.')}['"]`, 'i').test(src)) {
        violations.push(
          error(
            'analytics-forbidden-key',
            `Analytics module references forbidden key "${key}".`,
            {
              file: relPath,
              hint: 'Analytics payloads must never include file data.',
            },
          ),
        );
      }
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
            error('sensitive-data-leak', pattern.message, {
              file: relPath,
              line,
              hint: pattern.hint,
            }),
          );
        } else {
          violations.push(
            warning('sensitive-data-leak-risk', pattern.message, {
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

  violations.push(...(await checkAnalyticsPayloads()));

  return violations;
}
