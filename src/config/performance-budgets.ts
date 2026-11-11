/**
 * Performance budgets. Single source of truth for build-size and
 * runtime budget values. Consumed by platform/performance/resource-budget
 * and by scripts/tasks/performance validators.
 */

export interface BuildBudget {
  /** Max compressed initial JS (gzip) in KB. */
  initialJsKb: number;
  /** Max compressed total initial load (gzip) in KB. */
  initialTotalKb: number;
  /** Max single asset size (gzip) in KB. */
  maxAssetKb: number;
  /** Max number of JS chunks on first load. */
  maxInitialChunks: number;
}

export interface RuntimeBudget {
  /** Largest Contentful Paint threshold (ms) for "good". */
  lcpMs: number;
  /** Cumulative Layout Shift threshold (unitless) for "good". */
  cls: number;
  /** Interaction to Next Paint threshold (ms) for "good". */
  inpMs: number;
  /** Time to First Byte threshold (ms) for "good". */
  ttfbMs: number;
}

export const BUILD_BUDGET: Readonly<BuildBudget> = Object.freeze({
  initialJsKb: 200,
  initialTotalKb: 500,
  maxAssetKb: 200,
  maxInitialChunks: 5,
});

export const RUNTIME_BUDGET: Readonly<RuntimeBudget> = Object.freeze({
  lcpMs: 2500,
  cls: 0.1,
  inpMs: 200,
  ttfbMs: 800,
});

/** Bytes version of BUILD_BUDGET.initialJsKb for runtime checks. */
export const INITIAL_SCRIPT_BYTES = BUILD_BUDGET.initialJsKb * 1024;

/** Bytes version of BUILD_BUDGET.initialTotalKb for runtime checks. */
export const INITIAL_TOTAL_BYTES = BUILD_BUDGET.initialTotalKb * 1024;
