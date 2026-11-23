/**
 * Validator for static public assets, independent per-tool SVG icons, unique
 * 1200x630 Open Graph PNGs, and genuine ICO favicon container integrity.
 */

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ValidationIssue, ValidationReport } from '../../src/types/tool';
import { fileExists, readTextFile, resolveFromRoot } from '../utils/file-utils';
import { discoverToolsFromFilesystem } from '../utils/route-discovery';
import { assertReportPassed, createValidationReport } from '../utils/validation-utils';

const PNG_MAGIC = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ICO_MAGIC = Buffer.from([0x00, 0x00, 0x01, 0x00]);

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

function sha256File(filePath: string): string {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
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
  const seenOgHashes = new Map<string, string>();
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

  let faviconHash = '';

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
      continue;
    }

    if (rel === 'favicon.ico') {
      const icoBuf = fs.readFileSync(fullPath);
      if (icoBuf.length < 22 || !icoBuf.subarray(0, 4).equals(ICO_MAGIC)) {
        issues.push({
          code: 'ASSET_FAVICON_INVALID_ICO',
          severity: 'critical',
          target: 'public/favicon.ico',
          message: 'public/favicon.ico is not a valid Windows ICO binary (header 00 00 01 00).',
        });
      }
      faviconHash = sha256File(fullPath);
    }

    if (rel.endsWith('.png')) {
      const dims = readPngDimensions(fullPath);
      if (!dims || dims.width !== 1200 || dims.height !== 630) {
        issues.push({
          code: 'ASSET_INVALID_PNG',
          severity: 'critical',
          target: `public/${rel}`,
          message: `OG PNG public/${rel} must be 1200x630 (found ${dims ? `${dims.width}x${dims.height}` : 'unreadable'}).`,
        });
      }
      seenOgHashes.set(sha256File(fullPath), `public/${rel}`);
    }
  }

  // Enforce zero duplicate public/icons copies.
  checkedCount++;
  const duplicateIconsDir = path.join(publicDir, 'icons');
  if (fs.existsSync(duplicateIconsDir) && fs.readdirSync(duplicateIconsDir).length > 0) {
    issues.push({
      code: 'ASSET_DUPLICATE_PUBLIC_ICONS',
      severity: 'critical',
      target: 'public/icons/',
      message:
        'Duplicate tool icon copies exist in public/icons/. Keep icons solely under src/tools/<slug>/assets/tool-icon.svg.',
    });
  }

  const tools = await discoverToolsFromFilesystem(options.toolsRoot);
  for (const tool of tools) {
    if (!tool.implemented) continue;

    const srcIcon = path.join(tool.directory, 'assets', 'tool-icon.svg');
    const srcOg = path.join(tool.directory, 'assets', 'og-image.png');
    const publicOg = path.join(publicDir, 'og', `${tool.slug}.png`);

    checkedCount += 3;

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
      if (!dims || dims.width !== 1200 || dims.height !== 630) {
        issues.push({
          code: 'ASSET_TOOL_OG_INVALID',
          severity: 'critical',
          target: `${tool.slug}:og-image.png`,
          message: `Tool OG image must be 1200x630 PNG (found ${dims ? `${dims.width}x${dims.height}` : 'unreadable'}).`,
        });
      }
      const hash = sha256File(srcOg);
      if (faviconHash && hash === faviconHash) {
        issues.push({
          code: 'ASSET_OG_CLONES_FAVICON',
          severity: 'critical',
          target: `${tool.slug}:og-image.png`,
          message: `Tool OG image is identical in binary content to public/favicon.ico.`,
        });
      }
      const existingHolder = seenOgHashes.get(hash);
      if (existingHolder) {
        issues.push({
          code: 'ASSET_DUPLICATE_OG_BINARY',
          severity: 'critical',
          target: `${tool.slug}:og-image.png`,
          message: `Tool OG image duplicates binary content of ${existingHolder}. Each tool requires a unique OG image.`,
        });
      } else {
        seenOgHashes.set(hash, `${tool.slug}:og-image.png`);
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
