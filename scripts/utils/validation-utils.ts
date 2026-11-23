/**
 * Shared validation formatting & assertion utilities for AHADEX Tools scripts.
 *
 * Input: Validator name, checked item count, and array of ValidationIssue records.
 * Output: Structured ValidationReport objects with PASS/WARN/FAIL status and console formatting.
 * Failure behavior: `assertReportPassed` throws an Error (and sets process.exitCode = 1)
 * whenever one or more `critical` issues exist. Warnings do not abort builds unless strict mode is enabled.
 */

import type { ValidationIssue, ValidationReport, ValidationStatus } from '../../src/types/tool';

export function computeReportStatus(issues: readonly ValidationIssue[]): ValidationStatus {
  if (issues.some((issue) => issue.severity === 'critical')) {
    return 'FAIL';
  }
  if (issues.some((issue) => issue.severity === 'warning')) {
    return 'WARN';
  }
  return 'PASS';
}

export function createValidationReport(
  validator: string,
  checkedCount: number,
  issues: readonly ValidationIssue[],
): ValidationReport {
  return {
    validator,
    status: computeReportStatus(issues),
    timestamp: new Date().toISOString(),
    checkedCount,
    issues,
  };
}

export function printValidationReport(report: ValidationReport): void {
  const criticalCount = report.issues.filter((i) => i.severity === 'critical').length;
  const warningCount = report.issues.filter((i) => i.severity === 'warning').length;

  console.log(
    `[${report.status}] ${report.validator} — checked=${report.checkedCount}, critical=${criticalCount}, warnings=${warningCount}`,
  );

  for (const issue of report.issues) {
    const location = issue.target ? ` (${issue.target})` : '';
    const hint = issue.hint ? ` -> ${issue.hint}` : '';
    console.log(
      `  - [${issue.severity.toUpperCase()}] ${issue.code}${location}: ${issue.message}${hint}`,
    );
  }
}

export function assertReportPassed(report: ValidationReport, failOnWarnings = false): void {
  printValidationReport(report);

  const hasCritical = report.issues.some((i) => i.severity === 'critical');
  const hasWarning = report.issues.some((i) => i.severity === 'warning');

  if (hasCritical || (failOnWarnings && hasWarning)) {
    process.exitCode = 1;
    throw new Error(`Validation "${report.validator}" failed with status ${report.status}.`);
  }
}

export function isAbsoluteHttpsUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
