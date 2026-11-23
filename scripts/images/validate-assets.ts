/**
 * Validator for static public assets, tool SVG icons, and 512px+/1200x630
 * Open Graph PNG assets across source tool directories, public/, and dist/.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ValidationIssue, ValidationReport } from '../../src/types/tool';
import { fileExists, readTextFile, resolveFromRoot } from '../utils/file-utils';
import { discoverToolsFromFilesystem } from '../utils/route-discovery';
import { assertReportPassed, createValidationReport } from '../utils/validation-utils';

const PNG_MAGIC = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

export function readPngDimensions(filePath: string): { width: number; height: number } | null {
  const buf = fs.readFileSync(filePath);
  if (buf.length < 24 || !buf.subarray(0, 8).equals(PNG_MAGIC)) {
    return null;
  }
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

export async function runAssetValidation(
  options: {
    toolsRoot?: string;
    publicDir?: string;
    distDir?: string;
    verifyDist?: boolean;
  } = {},
): Promise<ValidationReport> {
  const issues: ValidationIssue[] = [];
  const publicDir = options.publicDir ?? resolveFromRoot('public');
  const distDir = options.distDir ?? resolveFromRoot('dist');
  let checkedCount = 0;

  const requiredPublicFiles = [
    'favicon.ico',
    'logo.svg',
    'ads.txt',
    'robots.txt',
    'sitemap.xml',
    'llms.txt',
    path.join('og', 'default.png'),
  ];

  for (const rel of requiredPublicFiles) {
    checkedCount++;
    const fullPath = path.join(publicDir, rel);
    if (!fileExists(fullPath)) {
      issues.push({
        code: 'ASSET_PUBLIC_MISSING',
        severity: 'critical',
        target: `public/${rel}`,
        message: `Required public asset missing: public/${rel}`,
        hint: 'Run `npm run generate:assets && npm run generate:sitemap`.',
      });
    } else if (rel.endsWith('.png')) {
      const dims = readPngDimensions(fullPath);
      if (!dims || dims.width < 512 || dims.height < 512) {
        issues.push({
          code: 'ASSET_INVALID_PNG',
          severity: 'critical',
          target: `public/${rel}`,
          message: `Invalid or undersized PNG at public/${rel}.`,
        });
      }
    }
  }

  const tools = await discoverToolsFromFilesystem(options.toolsRoot);
  for (const tool of tools) {
    if (!tool.implemented) continue;

    const srcIcon = path.join(tool.directory, 'assets', 'tool-icon.svg');
    const srcOg = path.join(tool.directory, 'assets', 'og-image.png');
    const publicOg = path.join(publicDir, 'og', `${tool.slug}.png`);
    const publicIcon = path.join(publicDir, 'icons', `${tool.slug}.svg`);

    checkedCount += 4;

    if (!fileExists(srcIcon) || !readTextFile(srcIcon).includes('<svg')) {
      issues.push({
        code: 'ASSET_TOOL_ICON_INVALID',
        severity: 'critical',
        target: `${tool.slug}:tool-icon.svg`,
        message: `Tool SVG icon missing or invalid at ${srcIcon}.`,
      });
    }

    if (!fileExists(srcOg)) {
      issues.push({
        code: 'ASSET_TOOL_OG_MISSING',
        severity: 'critical',
        target: `${tool.slug}:og-image.png`,
        message: `Tool OG image missing at ${srcOg}. Run \`npm run generate:assets\`.`,
      });
    } else {
      const dims = readPngDimensions(srcOg);
      if (!dims || dims.width < 512 || dims.height < 512) {
        issues.push({
          code: 'ASSET_TOOL_OG_INVALID',
          severity: 'critical',
          target: `${tool.slug}:og-image.png`,
          message: `Tool OG image has invalid dimensions (${dims ? `${dims.width}x${dims.height}` : 'unreadable'}).`,
        });
      }
    }

    if (!fileExists(publicOg)) {
      issues.push({
        code: 'ASSET_PUBLIC_OG_MISSING',
        severity: 'critical',
        target: `public/og/${tool.slug}.png`,
        message: `Published OG image missing at public/og/${tool.slug}.png. Run \`npm run generate:assets\`.`,
      });
    }

    if (!fileExists(publicIcon)) {
      issues.push({
        code: 'ASSET_PUBLIC_ICON_MISSING',
        severity: 'critical',
        target: `public/icons/${tool.slug}.svg`,
        message: `Published SVG icon missing at public/icons/${tool.slug}.svg. Run \`npm run generate:assets\`.`,
      });
    }

    if (options.verifyDist) {
      checkedCount++;
      const distOg = path.join(distDir, 'og', `${tool.slug}.png`);
      if (!fileExists(distOg)) {
        issues.push({
          code: 'ASSET_DIST_OG_MISSING',
          severity: 'critical',
          target: `dist/og/${tool.slug}.png`,
          message: `Built dist folder missing OG image: dist/og/${tool.slug}.png`,
        });
      }
    }
  }

  return createValidationReport('assets:integrity', checkedCount, issues);
}

const isDirectExecution =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  const verifyDist = process.argv.includes('--verify-dist');
  const strict = process.argv.includes('--strict');
  const report = await runAssetValidation({ verifyDist });
  assertReportPassed(report, strict);
}
