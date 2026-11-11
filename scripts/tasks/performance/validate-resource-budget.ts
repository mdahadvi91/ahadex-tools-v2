/**
 * Resource budget validator. Ensures the runtime budget check
 * (src/platform/performance/resource-budget.ts) is correctly wired:
 *   - DEFAULT_BUDGET uses INITIAL_SCRIPT_BYTES / INITIAL_TOTAL_BYTES
 *     from config/performance-budgets.ts (single source of truth)
 *   - isWithinBudget() and measureUsage() are exported
 *   - performance-monitor.ts calls isWithinBudget on load
 */

import { join } from 'node:path';
import { readText, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

const RESOURCE_BUDGET = join(PATHS.srcPlatform, 'performance/resource-budget.ts');
const MONITOR = join(PATHS.srcPlatform, 'performance/performance-monitor.ts');
const CONFIG_BUDGETS = join(PATHS.srcConfig, 'performance-budgets.ts');

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  // Rule 1: config/performance-budgets.ts exports byte constants.
  if (!(await pathExists(CONFIG_BUDGETS))) {
    violations.push(
      error('config-budgets-missing', 'src/config/performance-budgets.ts is missing.', {
        file: 'src/config/performance-budgets.ts',
      }),
    );
  } else {
    const src = await readText(CONFIG_BUDGETS);
    if (!/INITIAL_SCRIPT_BYTES/.test(src)) {
      violations.push(
        error(
          'config-missing-script-bytes',
          'performance-budgets.ts does not export INITIAL_SCRIPT_BYTES.',
          { file: 'src/config/performance-budgets.ts' },
        ),
      );
    }
    if (!/INITIAL_TOTAL_BYTES/.test(src)) {
      violations.push(
        error(
          'config-missing-total-bytes',
          'performance-budgets.ts does not export INITIAL_TOTAL_BYTES.',
          { file: 'src/config/performance-budgets.ts' },
        ),
      );
    }
  }

  // Rule 2: resource-budget.ts exists and imports from config.
  if (!(await pathExists(RESOURCE_BUDGET))) {
    violations.push(
      error('resource-budget-missing', 'src/platform/performance/resource-budget.ts is missing.', {
        file: 'src/platform/performance/resource-budget.ts',
      }),
    );
  } else {
    const src = await readText(RESOURCE_BUDGET);

    if (!/from\s+['"][^'"]*performance-budgets['"]/.test(src)) {
      violations.push(
        error(
          'resource-budget-not-wired',
          'resource-budget.ts does not import budgets from config.',
          {
            file: 'src/platform/performance/resource-budget.ts',
            hint: 'Budgets must be single source of truth in config.',
          },
        ),
      );
    }

    if (!/INITIAL_SCRIPT_BYTES|INITIAL_TOTAL_BYTES/.test(src)) {
      violations.push(
        warning(
          'resource-budget-no-constants',
          'resource-budget.ts does not reference the byte constants from config.',
          { file: 'src/platform/performance/resource-budget.ts' },
        ),
      );
    }

    if (!/export\s+function\s+isWithinBudget/.test(src)) {
      violations.push(
        error('resource-budget-no-check', 'resource-budget.ts does not export isWithinBudget.', {
          file: 'src/platform/performance/resource-budget.ts',
        }),
      );
    }

    if (!/export\s+function\s+measureUsage/.test(src)) {
      violations.push(
        error('resource-budget-no-measure', 'resource-budget.ts does not export measureUsage.', {
          file: 'src/platform/performance/resource-budget.ts',
        }),
      );
    }
  }

  // Rule 3: performance-monitor.ts calls isWithinBudget on load.
  if (!(await pathExists(MONITOR))) {
    violations.push(
      error('monitor-missing', 'src/platform/performance/performance-monitor.ts is missing.', {
        file: 'src/platform/performance/performance-monitor.ts',
      }),
    );
  } else {
    const src = await readText(MONITOR);
    if (!/isWithinBudget\(/.test(src)) {
      violations.push(
        error('monitor-no-budget-check', 'performance-monitor.ts does not call isWithinBudget.', {
          file: 'src/platform/performance/performance-monitor.ts',
          hint: 'Without it, resource overruns are never logged.',
        }),
      );
    }
    if (!/measureUsage\(/.test(src)) {
      violations.push(
        warning('monitor-no-measure', 'performance-monitor.ts does not call measureUsage.', {
          file: 'src/platform/performance/performance-monitor.ts',
        }),
      );
    }
  }

  return violations;
}
