/**
 * Lint task. Runs `eslint .` via child process and parses output.
 */

import { spawn } from 'node:child_process';
import { PATHS } from '../../utils/constants';
import { error, type Violation } from '../../utils/validation-result';

interface EslintIssue {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning';
  message: string;
  ruleId: string | null;
}

function parseEslintJson(output: string): EslintIssue[] {
  try {
    const results = JSON.parse(output) as Array<{
      filePath: string;
      messages: Array<{
        line: number;
        column: number;
        severity: 1 | 2;
        message: string;
        ruleId: string | null;
      }>;
    }>;
    const issues: EslintIssue[] = [];
    for (const result of results) {
      for (const msg of result.messages) {
        issues.push({
          file: result.filePath.replace(PATHS.root + '/', ''),
          line: msg.line,
          column: msg.column,
          severity: msg.severity === 2 ? 'error' : 'warning',
          message: msg.message,
          ruleId: msg.ruleId,
        });
      }
    }
    return issues;
  } catch {
    return [];
  }
}

export async function run(): Promise<Violation[]> {
  return new Promise((resolve) => {
    const child = spawn('npx', ['eslint', '.', '--format', 'json'], {
      cwd: PATHS.root,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve([]);
        return;
      }
      const issues = parseEslintJson(stdout);
      if (issues.length === 0) {
        resolve([
          error('eslint-failed', `eslint exited with code ${code}`, {
            hint: stderr.trim().slice(0, 500),
          }),
        ]);
        return;
      }
      resolve(
        issues
          .filter((i) => i.severity === 'error')
          .map((i) =>
            error(i.ruleId ?? 'eslint', i.message, {
              file: i.file,
              line: i.line,
              column: i.column,
            }),
          ),
      );
    });
  });
}
