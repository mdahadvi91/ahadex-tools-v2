/**
 * Type-check task. Runs `tsc -b` via child process and reports errors.
 */

import { spawn } from 'node:child_process';
import { PATHS } from '../../utils/constants';
import { error, type Violation } from '../../utils/validation-result';

interface TscError {
  file: string;
  line: number;
  column: number;
  message: string;
  code: string;
}

function parseTscOutput(output: string): TscError[] {
  const errors: TscError[] = [];
  const regex = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(output)) !== null) {
    errors.push({
      file: match[1],
      line: parseInt(match[2], 10),
      column: parseInt(match[3], 10),
      code: match[4],
      message: match[5],
    });
  }
  return errors;
}

export async function run(): Promise<Violation[]> {
  return new Promise((resolve) => {
    const child = spawn('npx', ['tsc', '-b'], {
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
      const allOutput = stdout + stderr;
      const parsed = parseTscOutput(allOutput);
      if (parsed.length === 0) {
        resolve([
          error('tsc-failed', `tsc exited with code ${code}`, {
            hint: allOutput.trim().slice(0, 500),
          }),
        ]);
        return;
      }
      resolve(
        parsed.map((e) =>
          error(e.code, e.message, {
            file: e.file.replace(PATHS.root + '/', ''),
            line: e.line,
            column: e.column,
          }),
        ),
      );
    });
  });
}
