/**
 * Report generator. Formats ValidationReport objects as Markdown
 * and writes them to a reports directory or stdout.
 */

import { join } from 'node:path';
import { PATHS } from './constants';
import { writeText } from './file-system';
import type { ValidationReport, Violation } from './validation-result';

function severityIcon(severity: Violation['severity']): string {
  switch (severity) {
    case 'error':
      return 'ERROR';
    case 'warning':
      return 'WARN ';
    case 'info':
      return 'INFO ';
    default:
      return '?????';
  }
}

function formatViolation(v: Violation): string {
  const location = v.file
    ? ` (${v.file}${v.line ? `:${v.line}` : ''}${v.column ? `:${v.column}` : ''})`
    : '';
  const hint = v.hint ? `\n  Hint: ${v.hint}` : '';
  return `- [${severityIcon(v.severity)}] \`${v.code}\` ${v.message}${location}${hint}`;
}

export function formatReportMarkdown(report: ValidationReport): string {
  const lines: string[] = [];
  lines.push(`# Validator: ${report.validator}`);
  lines.push('');
  lines.push(`**Group:** ${report.group}`);
  lines.push(`**Status:** ${report.ok ? 'PASS' : 'FAIL'}`);
  lines.push(`**Duration:** ${report.durationMs}ms`);
  lines.push(`**Started:** ${report.startedAt}`);
  lines.push('');

  if (report.violations.length === 0) {
    lines.push('No violations found.');
    return `${lines.join('\n')}\n`;
  }

  const errors = report.violations.filter((v) => v.severity === 'error');
  const warnings = report.violations.filter((v) => v.severity === 'warning');
  const infos = report.violations.filter((v) => v.severity === 'info');

  if (errors.length > 0) {
    lines.push(`## Errors (${errors.length})`);
    lines.push('');
    for (const v of errors) lines.push(formatViolation(v));
    lines.push('');
  }
  if (warnings.length > 0) {
    lines.push(`## Warnings (${warnings.length})`);
    lines.push('');
    for (const v of warnings) lines.push(formatViolation(v));
    lines.push('');
  }
  if (infos.length > 0) {
    lines.push(`## Info (${infos.length})`);
    lines.push('');
    for (const v of infos) lines.push(formatViolation(v));
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

export async function writeReport(
  report: ValidationReport,
  outputDir: string = join(PATHS.root, 'reports'),
): Promise<string> {
  const filename = `${report.group}-${report.validator}.md`;
  const path = join(outputDir, filename);
  await writeText(path, formatReportMarkdown(report));
  return path;
}

export async function writeGroupReport(
  groupName: string,
  reports: readonly ValidationReport[],
  outputDir: string = join(PATHS.root, 'reports'),
): Promise<string> {
  const lines: string[] = [];
  const totalErrors = reports.reduce(
    (sum, r) => sum + r.violations.filter((v) => v.severity === 'error').length,
    0,
  );
  const totalWarnings = reports.reduce(
    (sum, r) => sum + r.violations.filter((v) => v.severity === 'warning').length,
    0,
  );
  const ok = reports.every((r) => r.ok);

  lines.push(`# Group: ${groupName}`);
  lines.push('');
  lines.push(`**Validators:** ${reports.length}`);
  lines.push(`**Status:** ${ok ? 'PASS' : 'FAIL'}`);
  lines.push(`**Errors:** ${totalErrors}`);
  lines.push(`**Warnings:** ${totalWarnings}`);
  lines.push('');
  lines.push('## Validators');
  lines.push('');
  for (const r of reports) {
    lines.push(`- \`${r.validator}\` - ${r.ok ? 'PASS' : 'FAIL'} (${r.durationMs}ms)`);
  }
  lines.push('');

  const failed = reports.filter((r) => !r.ok);
  if (failed.length > 0) {
    lines.push('## Failures');
    lines.push('');
    for (const r of failed) {
      lines.push(`### \`${r.validator}\``);
      lines.push('');
      for (const v of r.violations.filter((x) => x.severity === 'error')) {
        lines.push(formatViolation(v));
      }
      lines.push('');
    }
  }

  const path = join(outputDir, `group-${groupName}.md`);
  await writeText(path, `${lines.join('\n')}\n`);
  return path;
}
