/**
 * Client-side resource budget checks. Reads budget values from
 * config/performance-budgets to keep one source of truth.
 */

import {
  INITIAL_SCRIPT_BYTES,
  INITIAL_TOTAL_BYTES,
} from '../../config/performance-budgets';

export interface ResourceBudget {
  /** Maximum script bytes (compressed) for the initial load. */
  initialScriptBytes: number;
  /** Maximum total transfer bytes for the initial load. */
  initialTotalBytes: number;
}

export const DEFAULT_BUDGET: Readonly<ResourceBudget> = Object.freeze({
  initialScriptBytes: INITIAL_SCRIPT_BYTES,
  initialTotalBytes: INITIAL_TOTAL_BYTES,
});

export interface BudgetUsage {
  scriptBytes: number;
  totalBytes: number;
}

export function measureUsage(): BudgetUsage {
  let scriptBytes = 0;
  let totalBytes = 0;
  if (typeof performance === 'undefined') {
    return { scriptBytes: 0, totalBytes: 0 };
  }
  for (const entry of performance.getEntriesByType('resource') as PerformanceResourceTiming[]) {
    const size = entry.encodedBodySize || 0;
    totalBytes += size;
    if (entry.initiatorType === 'script') {
      scriptBytes += size;
    }
  }
  return { scriptBytes, totalBytes };
}

export function isWithinBudget(
  usage: BudgetUsage,
  budget: ResourceBudget = DEFAULT_BUDGET,
): boolean {
  return (
    usage.scriptBytes <= budget.initialScriptBytes &&
    usage.totalBytes <= budget.initialTotalBytes
  );
}
