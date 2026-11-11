/**
 * Task runner: executes a single validator, catches errors,
 * prints a summary, and returns the result.
 */

import { EXIT_CODES, TIMEOUTS } from './constants';
import { createLogger } from './logger';
import {
  createReport,
  type ValidationReport,
  type ValidatorContext,
  type Violation,
} from './validation-result';

export interface TaskDefinition {
  /** Short identifier, e.g. "validate-metadata". */
  name: string;
  /** Group the task belongs to, e.g. "seo". */
  group: string;
  /** Implementation. Must return violations; may throw. */
  run: () => Promise<Violation[]>;
  /** Override the default FULL_TASK_MS timeout. */
  timeoutMs?: number;
}

export interface RunOptions {
  /** Suppress per-task log output. */
  quiet?: boolean;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Task timed out after ${ms}ms`)), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export async function runTask(
  task: TaskDefinition,
  options: RunOptions = {},
): Promise<ValidationReport> {
  const log = createLogger({ prefix: `[${task.group}]` });
  const startedAt = new Date().toISOString();
  const context: ValidatorContext = { name: task.name, group: task.group };

  if (!options.quiet) {
    log.debug(`running ${task.name}`);
  }

  let violations: Violation[];
  try {
    violations = await withTimeout(task.run(), task.timeoutMs ?? TIMEOUTS.FULL_TASK_MS);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    violations = [
      {
        code: 'task-failed',
        message: `Validator crashed: ${message}`,
        severity: 'error',
      },
    ];
  }

  const report = createReport(context, violations, startedAt);

  if (!options.quiet) {
    const errors = report.violations.filter((v) => v.severity === 'error');
    const warnings = report.violations.filter((v) => v.severity === 'warning');
    if (report.ok) {
      log.success(`${task.name} (${report.durationMs}ms)`);
    } else {
      log.error(`${task.name} - ${errors.length} error(s), ${warnings.length} warning(s)`);
      for (const v of errors) {
        log.error(`  ${v.code}: ${v.message}`);
      }
    }
  }

  return report;
}

export function exitCodeFor(report: ValidationReport): number {
  return report.ok ? EXIT_CODES.OK : EXIT_CODES.FAILURE;
}

export function exitWithReports(reports: readonly ValidationReport[]): never {
  const failed = reports.filter((r) => !r.ok);
  if (failed.length === 0) {
    process.exit(EXIT_CODES.OK);
  }
  process.exit(EXIT_CODES.FAILURE);
}
