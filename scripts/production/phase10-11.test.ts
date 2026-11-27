import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { generateAuditReports } from '../reports/generate-audit-report';
import { runPrebuildValidation } from './prebuild-validation';
import { buildCloudflareRedirectsContent, runDeploymentValidation } from '../tasks/deployment';

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

describe('Phase 10 prebuild validation & report generation', () => {
  it('passes full pre-build validation suite cleanly', async () => {
    const pre = await runPrebuildValidation();
    expect(pre.passed).toBe(true);
    expect(pre.reports.length).toBeGreaterThanOrEqual(6);
  });

  it('writes complete JSON and Markdown audit reports without fabricating external verification', async () => {
    const tmpReports = createTempDir('ahadex-reports-');
    const pre = await runPrebuildValidation();

    const paths = await generateAuditReports(
      {
        generatedAt: '2026-11-23T22:30:00.000Z',
        durationMs: 1234,
        prebuildReports: pre.reports,
        finalReports: [],
        crawlerSimulation: {
          mode: 'CONTROLLED_LOCAL_HTTP_SIMULATION',
          externalNetworkVerified: false,
          scopeNotice: 'Local simulation only',
          generatedAt: '2026-11-23T22:30:00.000Z',
          crawlerMatrix: [],
          crawledRoutes: [],
          checkedInternalLinks: 0,
          checkedAssets: 0,
          report: {
            validator: 'crawler:local-http-simulation',
            status: 'PASS',
            timestamp: '2026-11-23T22:30:00.000Z',
            checkedCount: 1,
            issues: [],
          },
        },
        overallPassed: true,
      },
      tmpReports,
    );

    expect(fs.existsSync(paths.seoReport)).toBe(true);
    expect(fs.existsSync(paths.routeReport)).toBe(true);
    expect(fs.existsSync(paths.crawlerReport)).toBe(true);
    expect(fs.existsSync(paths.buildSummary)).toBe(true);
    expect(fs.existsSync(paths.auditSummaryMd)).toBe(true);
    expect(fs.existsSync(paths.postDeployChecklistMd)).toBe(true);

    const summary = JSON.parse(fs.readFileSync(paths.buildSummary, 'utf8')) as {
      externalChecksStatus: string;
      status: string;
    };
    expect(summary.status).toBe('PASS');
    expect(summary.externalChecksStatus).toContain('NOT_RUN');

    const checklist = fs.readFileSync(paths.postDeployChecklistMd, 'utf8');
    expect(checklist).toContain('NOT_RUN');
    expect(checklist).toContain('https://ahadex.online');
  });
});

describe('Phase 11 Cloudflare Pages deployment config validation', () => {
  it('generates canonical www->apex, legacy /tool/*, and trailing-slash 301 redirects without SPA catch-all', () => {
    const content = buildCloudflareRedirectsContent([
      '/',
      '/about/',
      '/image-compressor/',
      '/image-resizer/',
      '/pdf-compressor/',
      '/merge-pdf/',
    ]);

    expect(content).toContain('https://www.ahadex.online/* https://ahadex.online/:splat 301');
    expect(content).toContain('/about /about/ 301');
    expect(content).toContain('/pdf-compressor /pdf-compressor/ 301');
    expect(content).toContain('/tool/image-compressor /image-compressor/ 301');
    expect(content).toContain('/tool/image-compressor/ /image-compressor/ 301');
    expect(content).toContain('/tool/image-resizer /image-resizer/ 301');
    expect(content).toContain('/tool/image-resizer/ /image-resizer/ 301');
    expect(content).not.toContain('/tool/about');
    expect(content).not.toContain('/* /index.html 200');
  });

  it('passes valid Cloudflare deployment folder and rejects soft-404 catch-all anti-pattern', async () => {
    const distFixture = createTempDir('ahadex-cf-dist-');
    fs.writeFileSync(path.join(distFixture, 'index.html'), '<html />', 'utf8');
    fs.writeFileSync(path.join(distFixture, '404.html'), '<html />', 'utf8');
    fs.writeFileSync(path.join(distFixture, 'ads.txt'), 'placeholder', 'utf8');
    fs.writeFileSync(path.join(distFixture, 'robots.txt'), 'User-agent: *\nAllow: /\n', 'utf8');
    fs.writeFileSync(path.join(distFixture, 'sitemap.xml'), '<urlset />', 'utf8');
    fs.writeFileSync(path.join(distFixture, 'llms.txt'), '# AHADEX Tools\n', 'utf8');

    const validHeaders = fs.readFileSync(path.resolve('public/_headers'), 'utf8');
    fs.writeFileSync(path.join(distFixture, '_headers'), validHeaders, 'utf8');
    fs.writeFileSync(
      path.join(distFixture, '_redirects'),
      buildCloudflareRedirectsContent([
        '/',
        '/about/',
        '/contact/',
        '/privacy-policy/',
        '/terms/',
        '/disclaimer/',
        '/cookie-policy/',
        '/image-compressor/',
        '/image-resizer/',
        '/pdf-compressor/',
        '/merge-pdf/',
        '/split-pdf/',
        '/cv-maker/',
      ]),
      'utf8',
    );

    const passing = await runDeploymentValidation({ distDir: distFixture });
    expect(passing.status).toBe('PASS');

    // Inject forbidden catch-all soft-404 rule and break security headers.
    fs.writeFileSync(path.join(distFixture, '_redirects'), '/* /index.html 200\n', 'utf8');
    fs.writeFileSync(path.join(distFixture, '_headers'), '/*\n  Cache-Control: no-store\n', 'utf8');

    const failing = await runDeploymentValidation({ distDir: distFixture });
    expect(failing.status).toBe('FAIL');
    expect(failing.issues.some((i) => i.code === 'DEPLOY_SPA_CATCHALL_SOFT404')).toBe(true);
    expect(failing.issues.some((i) => i.code === 'DEPLOY_MISSING_NOSNIFF')).toBe(true);
  });
});
