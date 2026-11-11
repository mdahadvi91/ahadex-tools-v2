/**
 * Shared runner for group orchestrators. Each *_orchestrator.ts file
 * becomes a thin wrapper that calls runGroup with its group name.
 */

import { EXIT_CODES } from '../utils/constants';
import { createLogger } from '../utils/logger';
import { writeGroupReport } from '../utils/report';
import { runTask } from '../utils/task-runner';
import type { GroupName } from '../registry/task-types';
import { TASKS } from '../registry/tasks';

export async function runGroup(name: GroupName): Promise<void> {
  const log = createLogger({ prefix: `[${name}]` });
  const group = TASKS[name];

  if (group.tasks.length === 0) {
    log.warn(`no tasks registered for group "${name}"`);
    process.exit(EXIT_CODES.OK);
  }

  log.heading(`${name} - ${group.description}`);

  const startedAt = Date.now();
  const reports = [];
  for (const task of group.tasks) {
    reports.push(await runTask(task));
  }

  const reportPath = await writeGroupReport(name, reports);
  const failed = reports.filter((r) => !r.ok);
  const totalErrors = reports.reduce(
    (sum, r) => sum + r.violations.filter((v) => v.severity === 'error').length,
    0,
  );
  const durationMs = Date.now() - startedAt;

  log.heading(`${name} summary`);
  log.info(`reports: ${reportPath}`);
  log.info(`duration: ${durationMs}ms`);
  log.info(`errors: ${totalErrors}`);

  if (failed.length === 0) {
    log.success(`${name} - PASS`);
    process.exit(EXIT_CODES.OK);
  }
  for (const r of failed) {
    log.error(`${r.validator} failed`);
    for (const v of r.violations.filter((x) => x.severity === 'error')) {
      log.error(`  ${v.code}: ${v.message}`);
    }
  }
  process.exit(EXIT_CODES.FAILURE);
}
