/**
 * Format check task. Runs `prettier --check .` and parses output.
 */

import { spawn } from 'node:child_process';
import { PATHS } from '../../utils/constants';
import { error, type Violation } from '../../utils/validation-result';

export async function run(): Promise<Violation[]> {
  return new Promise((resolve) => {
    const child = spawn('npx', ['prettier', '--check', '.'], {
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
      const combined = stdout + stderr;
      const unformatted = combined
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && l.includes('/'))
        .map((l) => l.replace(/^\[warn\] /, ''));

      if (unformatted.length === 0) {
        resolve([
          error('prettier-failed', `prettier exited with code ${code}`, {
            hint: combined.trim().slice(0, 500),
          }),
        ]);
        return;
      }
      resolve(
        unformatted.map((file) =>
          error('not-formatted', `File is not formatted: ${file}`, {
            file: file.replace(PATHS.root + '/', ''),
            hint: 'Run `npm run format` to fix.',
          }),
        ),
      );
    });
  });
}
