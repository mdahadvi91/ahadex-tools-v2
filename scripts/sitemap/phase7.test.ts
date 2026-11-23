import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createBrandedOgPng } from '../images/generate-assets';
import { readPngDimensions, runAssetValidation } from '../images/validate-assets';
import { runRobotsAndLlmsValidation } from './validate-robots';
import { extractSitemapLocs, runSitemapValidation } from './validate-sitemap';

describe('Phase 7 sitemap, robots, llms, and asset validators', () => {
  it('validates generated public/sitemap.xml, robots.txt, llms.txt, and asset integrity', async () => {
    const sitemapReport = await runSitemapValidation();
    expect(sitemapReport.status).toBe('PASS');

    const robotsReport = await runRobotsAndLlmsValidation();
    expect(robotsReport.status).toBe('PASS');

    const assetsReport = await runAssetValidation();
    expect(assetsReport.status).toBe('PASS');
  });

  it('generates valid 1200x630 RGB PNG buffers readable by PNG header parser', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ahadex-og-'));
    try {
      const target = path.join(tmpDir, 'test-og.png');
      fs.writeFileSync(target, createBrandedOgPng('pdf-compressor', 1200, 630));
      const dims = readPngDimensions(target);
      expect(dims).toEqual({ width: 1200, height: 630 });
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('extracts <loc> entries cleanly from XML', () => {
    const xml = `<urlset><url><loc>https://ahadex.online/</loc></url><url><loc>https://ahadex.online/merge-pdf/</loc></url></urlset>`;
    expect(extractSitemapLocs(xml)).toEqual([
      'https://ahadex.online/',
      'https://ahadex.online/merge-pdf/',
    ]);
  });
});
