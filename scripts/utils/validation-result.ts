/**
 * Shared result type for all validators.
 * Every validator returns a ValidationReport, never throws.
 */

export type Severity = 'error' | 'warning' | 'info';

export interface Violation {
  /** Stable machine-readable code, e.g. "missing-title". */
  code: string;
  /** Human-readable message. */
  message: string;
  /** File path relative to project root, when applicable. */
  file?: string;
  /** Line number in the file, when applicable. */
  line?: number;
  /** Column number in the file, when applicable. */
  column?: number;
  /** Severity. Errors block; warnings and info do not. */
  severity: Severity;
  /** Optional remediation hint. */
  hint?: string;
}

export interface ValidationReport {
  /** Validator name, e.g. "validate-metadata". */
  validator: string;
  /** Group the validator belongs to, e.g. "seo". */
  group: string;
  /** True when no error-severity violations exist. */
  ok: boolean;
  /** All violations, warnings, info collected. */
  violations: Violation[];
  /** Wall-clock duration in milliseconds. */
  durationMs: number;
  /** ISO timestamp when validation started. */
  startedAt: string;
}

export interface ValidatorContext {
  /** Validator name. */
  name: string;
  /** Group name. */
  group: string;
}

export function createReport(
  context: ValidatorContext,
  violations: Violation[],
  startedAt: string,
): ValidationReport {
  const ok = !violations.some((v) => v.severity === 'error');
  const durationMs = Date.now() - new Date(startedAt).getTime();
  return {
    validator: context.name,
    group: context.group,
    ok,
    violations,
    durationMs,
    startedAt,
  };
}

export function error(
  code: string,
  message: string,
  extras: Partial<Omit<Violation, 'code' | 'message' | 'severity'>> = {},
): Violation {
  return { code, message, severity: 'error', ...extras };
}

export function warning(
  code: string,
  message: string,
  extras: Partial<Omit<Violation, 'code' | 'message' | 'severity'>> = {},
): Violation {
  return { code, message, severity: 'warning', ...extras };
}

export function info(
  code: string,
  message: string,
  extras: Partial<Omit<Violation, 'code' | 'message' | 'severity'>> = {},
): Violation {
  return { code, message, severity: 'info', ...extras };
}

export function summarize(report: ValidationReport): string {
  const errors = report.violations.filter((v) => v.severity === 'error').length;
  const warnings = report.violations.filter((v) => v.severity === 'warning').length;
  const infos = report.violations.filter((v) => v.severity === 'info').length;
  return `${report.validator}: ${report.ok ? 'OK' : 'FAIL'} (${errors} errors, ${warnings} warnings, ${infos} info, ${report.durationMs}ms)`;
}
