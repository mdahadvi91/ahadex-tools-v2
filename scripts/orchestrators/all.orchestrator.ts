#!/usr/bin/env tsx
/**
 * Master orchestrator. Runs every registered group in topological
 * order based on GROUP_DEPENDENCIES. Writes per-group reports and an
 * overall summary. Exits non-zero if any group fails.
 */

import { EXIT_CODES } from '../utils/constants';
import { createLogger } from '../utils/logger';
import { resolveOrder } from '../utils/dependency-resolver';
import { runTask } from '../utils/task-runner';
import { writeGroupReport, writeReport } from '../utils/report';
import { GROUP_DEPENDENCIES } from '../registry/dependencies';
import { TASKS } from '../registry/tasks';
import type { GroupName } from '../registry/task-types';
import type { ValidationReport } from '../utils/validation-result';
import { createReport } from '../utils/validation-result';

interface GroupOutcome {
  name: GroupName;
  reports: ValidationReport[];
  ok: boolean;
  durationMs: number;
}

async function runGroups(): Promise<GroupOutcome[]> {
  const { order, cycles } = resolveOrder(GROUP_DEPENDENCIES);
  if (cycles.length > 0) {
    const log = createLogger({ prefix: '[all]' });
    log.error(`dependency cycles detected: ${JSON.stringify(cycles)}`);
    process.exit(EXIT_CODES.CONFIG_ERROR);
  }

  const log = createLogger({ prefix: '[all]' });
  log.heading(`executing ${order.length} groups in topological order`);
  log.info(order.join(' -> '));

  const outcomes: GroupOutcome[] = [];

  for (const name of order as GroupName[]) {
    const group = TASKS[name];
    if (group.tasks.length === 0) {
      log.debug(`skip ${name} (no tasks)`);
      outcomes.push({ name, reports: [], ok: true, durationMs: 0 });
      continue;
    }

    log.heading(`group: ${name}`);
    const startedAt = Date.now();
    const reports: ValidationReport[] = [];
    for (const task of group.tasks) {
      reports.push(await runTask(task, { quiet: true }));
    }
    await writeGroupReport(name, reports);
    const ok = reports.every((r) => r.ok);
    const durationMs = Date.now() - startedAt;
    const errors = reports.reduce(
      (sum, r) => sum + r.violations.filter((v) => v.severity === 'error').length,
      0,
    );
    if (ok) {
      log.success(`${name} PASS (${reports.length} tasks, ${durationMs}ms)`);
    } else {
      log.error(`${name} FAIL (${reports.length} tasks, ${errors} errors, ${durationMs}ms)`);
    }
    outcomes.push({ name, reports, ok, durationMs });
  }

  return outcomes;
}

async function main(): Promise<void> {
  const log = createLogger({ prefix: '[all]' });
  const startedAt = new Date().toISOString();
  const startMs = Date.now();

  const outcomes = await runGroups();

  const totalTasks = outcomes.reduce((sum, o) => sum + o.reports.length, 0);
  const totalErrors = outcomes.reduce(
    (sum, o) =>
      sum +
      o.reports.reduce((s, r) => s + r.violations.filter((v) => v.severity === 'error').length, 0),
    0,
  );
  const totalWarnings = outcomes.reduce(
    (sum, o) =>
      sum +
      o.reports.reduce(
        (s, r) => s + r.violations.filter((v) => v.severity === 'warning').length,
        0,
      ),
    0,
  );
  const failed = outcomes.filter((o) => !o.ok);
  const durationMs = Date.now() - startMs;

  const summary = createReport({ name: 'all', group: 'production' }, [], startedAt);
  summary.durationMs = durationMs;
  summary.ok = failed.length === 0;
  await writeReport(summary);

  log.heading('summary');
  log.info(`groups: ${outcomes.length}`);
  log.info(`tasks: ${totalTasks}`);
  log.info(`errors: ${totalErrors}`);
  log.info(`warnings: ${totalWarnings}`);
  log.info(`duration: ${durationMs}ms`);

  if (failed.length === 0) {
    log.success('ALL PASS');
    process.exit(EXIT_CODES.OK);
  }
  log.error(`FAILED GROUPS: ${failed.map((o) => o.name).join(', ')}`);
  process.exit(EXIT_CODES.FAILURE);
}

await main();
