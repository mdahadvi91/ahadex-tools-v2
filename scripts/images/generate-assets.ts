/**
 * Automated Open Graph PNG & SVG icon asset pipeline for AHADEX Tools.
 *
 * Uses pure Node built-ins (node:zlib + CRC32) to synthesize clean 1200x630
 * Open Graph PNG banners whenever a tool asset or default OG image is absent,
 * and syncs every tool's `og-image.png` and `tool-icon.svg` into `public/`
 * (and `dist/` when present) so prerendered social tags resolve reliably.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';
import { ensureDir, fileExists, resolveFromRoot } from '../utils/file-utils';
import { discoverToolsFromFilesystem } from '../utils/route-discovery';

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, crcInput, crcBuf]);
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Generates a crisp 1200x630 RGB PNG with an AHADEX Cobalt design frame,
 * rounded geometric accent band, and subtle grid stripes (no external dependencies).
 */
export function createBrandedOgPng(seedName: string, width = 1200, height = 630): Buffer {
  const seed = hashSeed(seedName);
  const accentBlueR = 29 + (seed % 18);
  const accentBlueG = 78 + ((seed >> 4) % 24);
  const accentBlueB = 216 + ((seed >> 8) % 28);

  const stride = 1 + width * 3;
  const raw = Buffer.alloc(stride * height);

  const cardLeft = 96;
  const cardRight = width - 96;
  const cardTop = 84;
  const cardBottom = height - 84;

  for (let y = 0; y < height; y++) {
    const rowStart = y * stride;
    raw[rowStart] = 0; // Filter type: None

    for (let x = 0; x < width; x++) {
      const idx = rowStart + 1 + x * 3;
      let r = 248;
      let g = 250;
      let b = 252;

      // Subtle background grid lines every 48px outside card
      if (x % 48 === 0 || y % 48 === 0) {
        r = 238;
        g = 242;
        b = 247;
      }

      // Main white architectural card surface
      if (x >= cardLeft && x <= cardRight && y >= cardTop && y <= cardBottom) {
        r = 255;
        g = 255;
        b = 255;

        // Top cobalt brand stripe on card
        if (y <= cardTop + 14) {
          r = accentBlueR;
          g = accentBlueG;
          b = accentBlueB;
        } else if (x === cardLeft || x === cardRight || y === cardBottom) {
          r = 226;
          g = 232;
          b = 240;
        } else if (x >= 160 && x <= 256 && y >= 156 && y <= 252) {
          // Brand square emblem inside card
          r = accentBlueR;
          g = accentBlueG;
          b = accentBlueB;
        } else if (x >= 160 && x <= 740 && y >= 292 && y <= 324) {
          // Headline bar graphic
          r = 15;
          g = 23;
          b = 42;
        } else if (x >= 160 && x <= 620 && y >= 348 && y <= 368) {
          // Subheadline bar graphic
          r = 71;
          g = 85;
          b = 105;
        } else if (x >= 160 && x <= 380 && y >= 430 && y <= 466) {
          // Privacy accent CTA block
          r = accentBlueR;
          g = accentBlueG;
          b = accentBlueB;
        }
      }

      raw[idx] = r;
      raw[idx + 1] = g;
      raw[idx + 2] = b;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 2; // Color type: RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const compressed = deflateSync(raw, { level: 6 });

  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

export interface AssetGenerationSummary {
  readonly generatedCount: number;
  readonly syncedPublicCount: number;
  readonly syncedDistCount: number;
  readonly generatedPaths: readonly string[];
}

export async function generateAndSyncAssets(
  options: {
    toolsRoot?: string;
    publicDir?: string;
    distDir?: string;
  } = {},
): Promise<AssetGenerationSummary> {
  const publicDir = options.publicDir ?? resolveFromRoot('public');
  const distDir = options.distDir ?? resolveFromRoot('dist');
  const hasDist = fileExists(distDir);
  const generatedPaths: string[] = [];

  let generatedCount = 0;
  let syncedPublicCount = 0;
  let syncedDistCount = 0;

  // 1. Default site OG banner -> public/og/default.png (and dist/og/default.png)
  const defaultOgPublic = path.join(publicDir, 'og', 'default.png');
  if (!fileExists(defaultOgPublic)) {
    ensureDir(path.dirname(defaultOgPublic));
    fs.writeFileSync(defaultOgPublic, createBrandedOgPng('ahadex-default'));
    generatedCount++;
    generatedPaths.push(path.relative(process.cwd(), defaultOgPublic));
  }
  syncedPublicCount++;
  if (hasDist) {
    const defaultOgDist = path.join(distDir, 'og', 'default.png');
    ensureDir(path.dirname(defaultOgDist));
    fs.copyFileSync(defaultOgPublic, defaultOgDist);
    syncedDistCount++;
  }

  // 2. Per-tool OG banners & SVG icons
  const tools = await discoverToolsFromFilesystem(options.toolsRoot);
  for (const tool of tools) {
    if (!tool.implemented) continue;

    const toolAssetsDir = path.join(tool.directory, 'assets');
    const sourceOg = path.join(toolAssetsDir, 'og-image.png');
    const sourceIcon = path.join(toolAssetsDir, 'tool-icon.svg');

    if (!fileExists(sourceOg)) {
      ensureDir(toolAssetsDir);
      fs.writeFileSync(sourceOg, createBrandedOgPng(tool.slug));
      generatedCount++;
      generatedPaths.push(path.relative(process.cwd(), sourceOg));
    }

    const publicOg = path.join(publicDir, 'og', `${tool.slug}.png`);
    ensureDir(path.dirname(publicOg));
    fs.copyFileSync(sourceOg, publicOg);
    syncedPublicCount++;

    if (hasDist) {
      const distOg = path.join(distDir, 'og', `${tool.slug}.png`);
      ensureDir(path.dirname(distOg));
      fs.copyFileSync(sourceOg, distOg);
      syncedDistCount++;
    }

    if (fileExists(sourceIcon)) {
      const publicIcon = path.join(publicDir, 'icons', `${tool.slug}.svg`);
      ensureDir(path.dirname(publicIcon));
      fs.copyFileSync(sourceIcon, publicIcon);
      syncedPublicCount++;

      if (hasDist) {
        const distIcon = path.join(distDir, 'icons', `${tool.slug}.svg`);
        ensureDir(path.dirname(distIcon));
        fs.copyFileSync(sourceIcon, distIcon);
        syncedDistCount++;
      }
    }
  }

  return {
    generatedCount,
    syncedPublicCount,
    syncedDistCount,
    generatedPaths,
  };
}

const isDirectExecution =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  const summary = await generateAndSyncAssets();
  console.log(
    `[PASS] assets:generate — generated=${summary.generatedCount}, public_synced=${summary.syncedPublicCount}, dist_synced=${summary.syncedDistCount}`,
  );
  for (const created of summary.generatedPaths) {
    console.log(`  + created ${created}`);
  }
}
