/**
 * Secret scanner. Detects potential secrets (API keys, tokens,
 * passwords, private keys) in tracked source files. Skips
 * .env.example, node_modules, dist, reports.
 */

import { relative } from 'node:path';
import { readText, walkFiles } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

interface SecretPattern {
  name: string;
  regex: RegExp;
  severity: 'error' | 'warning';
  description: string;
}

const PATTERNS: readonly SecretPattern[] = [
  {
    name: 'aws-access-key',
    regex: /\bAKIA[0-9A-Z]{16}\b/g,
    severity: 'error',
    description: 'AWS access key ID',
  },
  {
    name: 'aws-secret-key',
    regex: /aws[_-]?secret[_-]?(?:access[_-]?)?key\s*[=:]\s*['"]?([A-Za-z0-9/+=]{40})['"]?/gi,
    severity: 'error',
    description: 'AWS secret access key',
  },
  {
    name: 'google-api-key',
    regex: /\bAIza[0-9A-Za-z_-]{35}\b/g,
    severity: 'error',
    description: 'Google API key',
  },
  {
    name: 'github-pat',
    regex: /\bghp_[A-Za-z0-9]{36}\b/g,
    severity: 'error',
    description: 'GitHub personal access token',
  },
  {
    name: 'github-oauth',
    regex: /\bgho_[A-Za-z0-9]{36}\b/g,
    severity: 'error',
    description: 'GitHub OAuth token',
  },
  {
    name: 'slack-token',
    regex: /\bxox[baprs]-[0-9a-zA-Z]{10,}/g,
    severity: 'error',
    description: 'Slack token',
  },
  {
    name: 'stripe-key',
    regex: /\bsk_live_[0-9a-zA-Z]{24,}\b/g,
    severity: 'error',
    description: 'Stripe live secret key',
  },
  {
    name: 'private-key-block',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
    severity: 'error',
    description: 'Embedded private key',
  },
  {
    name: 'generic-api-key',
    regex: /(?:api[_-]?key|apikey)\s*[=:]\s*['"]([A-Za-z0-9_-]{20,})['"]/gi,
    severity: 'warning',
    description: 'Possible API key assignment',
  },
  {
    name: 'generic-password',
    regex: /(?:password|passwd|pwd)\s*[=:]\s*['"]([^'"\s]{8,})['"]/gi,
    severity: 'warning',
    description: 'Possible hardcoded password',
  },
];

const SKIP_PATTERNS = [
  /\.env\.example$/,
  /\/node_modules\//,
  /\/dist\//,
  /\/reports\//,
  /\.lock$/,
  /package-lock\.json$/,
  /\.min\.js$/,
  /\/docs\/adr\//,
];

function shouldSkip(filePath: string): boolean {
  return SKIP_PATTERNS.some((re) => re.test(filePath));
}

function lineNumberAt(source: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

/** Matches in the test file itself (this file) are ignored. */
const SELF_FILE = 'scripts/tasks/security/secret-scan.ts';

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const sourceFiles = await walkFiles(PATHS.root, {
    extensions: [
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.mjs',
      '.cjs',
      '.json',
      '.md',
      '.yml',
      '.yaml',
      '.toml',
      '.env',
    ],
    skipDirs: ['node_modules', '.git', 'dist', 'coverage', '.vite', 'reports'],
  });

  for (const file of sourceFiles) {
    if (shouldSkip(file)) continue;
    const relPath = relative(PATHS.root, file).split('\\').join('/');
    if (relPath === SELF_FILE) continue;

    let source: string;
    try {
      source = await readText(file);
    } catch {
      continue;
    }

    // Ignore minified / single-line giants to reduce false positives.
    if (source.length > 2_000_000) continue;

    for (const pattern of PATTERNS) {
      // Fresh RegExp per file: avoid lastIndex carryover with /g.
      const re = new RegExp(
        pattern.regex.source,
        pattern.regex.flags.includes('g') ? pattern.regex.flags : pattern.regex.flags + 'g',
      );
      let match: RegExpExecArray | null;
      while ((match = re.exec(source)) !== null) {
        const line = lineNumberAt(source, match.index);
        const severity = pattern.severity;
        const message = `Possible ${pattern.description} detected.`;
        if (severity === 'error') {
          violations.push(
            error('secret-detected', message, {
              file: relPath,
              line,
              hint: 'Remove the secret and rotate the credential.',
            }),
          );
        } else {
          violations.push(
            warning('secret-suspect', message, {
              file: relPath,
              line,
              hint: 'Confirm this is not a real credential.',
            }),
          );
        }
        // Prevent infinite loop on zero-width matches.
        if (match.index === re.lastIndex) re.lastIndex += 1;
        // Only report first match per pattern per file to reduce noise.
        break;
      }
    }
  }

  return violations;
}
