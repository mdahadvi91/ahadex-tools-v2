import { describe, expect, it } from 'vitest';
import { buildCanonicalUrl, normalizeRoutePath } from '../../config/site.config';
import { discoverPublishedRoutes, discoverToolsFromFilesystem } from './route-discovery';
import {
  assertReportPassed,
  computeReportStatus,
  createValidationReport,
} from './validation-utils';

describe('Phase 2 build utilities', () => {
  it('normalizes routes with trailing-slash canonical policy', () => {
    expect(normalizeRoutePath('/')).toBe('/');
    expect(normalizeRoutePath('/about')).toBe('/about/');
    expect(normalizeRoutePath('image-compressor')).toBe('/image-compressor/');
    expect(buildCanonicalUrl('/image-compressor')).toBe('https://ahadex.online/image-compressor/');
    expect(buildCanonicalUrl('/')).toBe('https://ahadex.online/');
  });

  it('discovers tools directly from src/tools filesystem without crashing on stub tools', async () => {
    const tools = await discoverToolsFromFilesystem();
    expect(tools.length).toBeGreaterThanOrEqual(2);

    const liveTools = tools.filter((t) => t.implemented && t.status === 'live');
    expect(liveTools.some((t) => t.slug === 'image-compressor')).toBe(true);
    expect(liveTools.some((t) => t.slug === 'image-resizer')).toBe(true);
  });

  it('discovers combined static and live tool routes', async () => {
    const routes = await discoverPublishedRoutes();
    expect(routes.some((r) => r.path === '/' && r.kind === 'static')).toBe(true);
    expect(routes.some((r) => r.slug === 'image-compressor' && r.kind === 'tool')).toBe(true);
  });

  it('computes PASS, WARN, FAIL validation reports accurately', () => {
    const passReport = createValidationReport('sample', 2, []);
    expect(passReport.status).toBe('PASS');
    expect(() => assertReportPassed(passReport)).not.toThrow();

    const warnStatus = computeReportStatus([
      { code: 'WARN_1', severity: 'warning', message: 'Minor warning' },
    ]);
    expect(warnStatus).toBe('WARN');

    const failReport = createValidationReport('sample', 1, [
      { code: 'ERR_1', severity: 'critical', message: 'Critical failure' },
    ]);
    expect(failReport.status).toBe('FAIL');
    expect(() => assertReportPassed(failReport)).toThrow();
    process.exitCode = 0;
  });
});
