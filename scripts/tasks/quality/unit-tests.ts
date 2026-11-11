/**
 * Unit tests task. Runs `vitest run` and parses JSON output.
 * If vitest is not yet installed, returns an informational violation
 * rather than an error, so early development is not blocked.
 */

import { spawn } from 'node:child_process';
import { PATHS } from '../../utils/constants';
import { error, info, warning, type Violation } from '../../utils/validation-result';

interface VitestAssertionResult {
  title: string;
  status: 'passed' | 'failed' | 'skipped' | 'pending';
  failureMessages?: string[];
}

interface VitestTestResult {
  name: string;
  assertionResults: VitestAssertionResult[];
}

interface VitestJson {
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  testResults: VitestTestResult[];
}

function parseVitestJson(output: string): VitestJson | null {
  try {
    const start = output.indexOf('{');
    const end = output.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    return JSON.parse(output.slice(start, end + 1)) as VitestJson;
  } catch {
    return null;
  }
}

export async function run(): Promise<Violation[]> {
  const vitestBin = `${PATHS.root}/node_modules/.bin/vitest`;
  const { pathExists } = await import('../../utils/file-system');
  if (!(await pathExists(vitestBin))) {
    return [
      info('vitest-not-installed', 'vitest is not installed yet. Skipping unit test validation.', {
        hint: 'Install vitest when the first tool tests are written.',
      }),
    ];
  }

  return new Promise((resolve) => {
    const child = spawn(vitestBin, ['run', '--reporter=json'], {
      cwd: PATHS.root,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, CI: '1' },
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
      const json = parseVitestJson(stdout);
      if (!json) {
        if (code === 0) return resolve([]);
        return resolve([
          error('vitest-parse-failed', `Could not parse vitest output (exit ${code}).`, {
            hint: (stderr || stdout).trim().slice(0, 500),
          }),
        ]);
      }

      const violations: Violation[] = [];
      for (const testFile of json.testResults) {
        for (const assertion of testFile.assertionResults) {
          if (assertion.status === 'failed') {
            violations.push(
              error('test-failed', `${assertion.title} failed`, {
                file: testFile.name.replace(PATHS.root + '/', ''),
                hint: (assertion.failureMessages ?? []).join('\n').slice(0, 500),
              }),
            );
          }
        }
      }

      if (violations.length === 0 && json.numFailedTests > 0) {
        violations.push(
          warning(
            'tests-failed-unreported',
            `${json.numFailedTests} tests failed but no individual failure was captured.`,
          ),
        );
      }

      return resolve(violations);
    });
  });
}
