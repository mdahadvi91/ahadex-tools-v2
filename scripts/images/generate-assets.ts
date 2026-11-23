/**
 * Automated Open Graph PNG & Favicon Asset Pipeline for AHADEX Tools.
 *
 * Uses pure Node built-ins (node:zlib + CRC32 + SHA-256) to synthesize:
 *   - Unique 1200x630 Open Graph PNG banners per tool (`src/tools/<slug>/assets/og-image.png`)
 *     and site default (`public/og/default.png`), regenerating any missing, mis-sized,
 *     or duplicate-binary OG image automatically.
 *   - A genuine 32x32 Windows `.ico` (PNG-inside-ICO container) for `public/favicon.ico`.
 *   - Keeps per-tool `tool-icon.svg` independent under `src/tools/<slug>/assets/`
 *     without duplicating files into `public/icons/`.
 */

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';
import { ensureDir, fileExists, resolveFromRoot } from '../utils/file-utils';
import { discoverToolsFromFilesystem } from '../utils/route-discovery';

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ICO_HEADER_PREFIX = Buffer.from([0x00, 0x00, 0x01, 0x00]);

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

function sha256File(filePath: string): string {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function isExactPngSize(filePath: string, expectedWidth: number, expectedHeight: number): boolean {
  const buf = fs.readFileSync(filePath);
  if (buf.length < 24 || !buf.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return false;
  }
  return buf.readUInt32BE(16) === expectedWidth && buf.readUInt32BE(20) === expectedHeight;
}

/**
 * Generates a unique 1200x630 RGB PNG with an AHADEX architectural card and
 * deterministic per-slug stripe pattern so every tool has a visually and
 * cryptographically distinct OG image.
 */
export function createBrandedOgPng(seedName: string, width = 1200, height = 630): Buffer {
  const seed = hashSeed(seedName);
  const accentBlueR = 24 + (seed % 28);
  const accentBlueG = 72 + ((seed >> 4) % 44);
  const accentBlueB = 200 + ((seed >> 8) % 48);
  const badgeBarOffset = 460 + (seed % 220);

  const stride = 1 + width * 3;
  const raw = Buffer.alloc(stride * height);

  const cardLeft = 96;
  const cardRight = width - 96;
  const cardTop = 84;
  const cardBottom = height - 84;

  for (let y = 0; y < height; y++) {
    const rowStart = y * stride;
    raw[rowStart] = 0;

    for (let x = 0; x < width; x++) {
      const idx = rowStart + 1 + x * 3;
      let r = 248;
      let g = 250;
      let b = 252;

      if (x % 48 === 0 || y % 48 === 0) {
        r = 238;
        g = 242;
        b = 247;
      }

      if (x >= cardLeft && x <= cardRight && y >= cardTop && y <= cardBottom) {
        r = 255;
        g = 255;
        b = 255;

        if (y <= cardTop + 14) {
          r = accentBlueR;
          g = accentBlueG;
          b = accentBlueB;
        } else if (x === cardLeft || x === cardRight || y === cardBottom) {
          r = 226;
          g = 232;
          b = 240;
        } else if (x >= 160 && x <= 256 && y >= 156 && y <= 252) {
          r = accentBlueR;
          g = accentBlueG;
          b = accentBlueB;
        } else if (x >= 160 && x <= badgeBarOffset + 220 && y >= 292 && y <= 324) {
          r = 15;
          g = 23;
          b = 42;
        } else if (x >= 160 && x <= 620 && y >= 348 && y <= 368) {
          r = 71;
          g = 85;
          b = 105;
        } else if (x >= 160 && x <= 380 && y >= 430 && y <= 466) {
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
  ihdr[8] = 8;
  ihdr[9] = 2;
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

/**
 * Creates a compliant 32x32 PNG-encoded ICO binary for `public/favicon.ico`.
 */
export function createValidFaviconIco(): Buffer {
  const size = 32;
  const stride = 1 + size * 4;
  const raw = Buffer.alloc(stride * size);

  for (let y = 0; y < size; y++) {
    const rowStart = y * stride;
    raw[rowStart] = 0;
    for (let x = 0; x < size; x++) {
      const idx = rowStart + 1 + x * 4;
      const isBorder = x < 2 || x >= size - 2 || y < 2 || y >= size - 2;
      const isLetterA =
        y >= 8 &&
        y <= 24 &&
        Math.abs(x - 16) <= Math.floor((y - 6) / 3) + 1 &&
        !(y >= 17 && y <= 24 && Math.abs(x - 16) <= 2);

      if (isLetterA) {
        raw[idx] = 255;
        raw[idx + 1] = 255;
        raw[idx + 2] = 255;
        raw[idx + 3] = 255;
      } else {
        raw[idx] = isBorder ? 30 : 37;
        raw[idx + 1] = isBorder ? 64 : 99;
        raw[idx + 2] = isBorder ? 175 : 235;
        raw[idx + 3] = 255;
      }
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const pngPayload = Buffer.concat([
    PNG_SIGNATURE,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 6 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);

  // ICONDIR (6 bytes) + ICONDIRENTRY (16 bytes) + PNG payload
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // image type: ICO
  header.writeUInt16LE(1, 4); // count: 1

  header[6] = size; // width
  header[7] = size; // height
  header[8] = 0; // color palette count
  header[9] = 0; // reserved
  header.writeUInt16LE(1, 10); // planes
  header.writeUInt16LE(32, 12); // bits per pixel
  header.writeUInt32LE(pngPayload.length, 14); // bytes in resource
  header.writeUInt32LE(22, 18); // offset of image data

  return Buffer.concat([header, pngPayload]);
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
  const seenOgHashes = new Set<string>();

  let generatedCount = 0;
  let syncedPublicCount = 0;
  let syncedDistCount = 0;

  // 1. Ensure public/favicon.ico is a valid ICO container (not a misnamed PNG).
  const faviconPublic = path.join(publicDir, 'favicon.ico');
  const needsFavicon =
    !fileExists(faviconPublic) ||
    !fs.readFileSync(faviconPublic).subarray(0, 4).equals(ICO_HEADER_PREFIX);
  if (needsFavicon) {
    ensureDir(path.dirname(faviconPublic));
    fs.writeFileSync(faviconPublic, createValidFaviconIco());
    generatedCount++;
    generatedPaths.push(path.relative(process.cwd(), faviconPublic));
  }

  // 2. Clean up deprecated duplicate public/icons directory if present.
  const deprecatedIconsDir = path.join(publicDir, 'icons');
  if (fs.existsSync(deprecatedIconsDir)) {
    fs.rmSync(deprecatedIconsDir, { recursive: true, force: true });
  }

  // 3. Default site OG banner -> public/og/default.png (must be unique 1200x630 PNG)
  const defaultOgPublic = path.join(publicDir, 'og', 'default.png');
  if (!fileExists(defaultOgPublic) || !isExactPngSize(defaultOgPublic, 1200, 630)) {
    ensureDir(path.dirname(defaultOgPublic));
    fs.writeFileSync(defaultOgPublic, createBrandedOgPng('ahadex-default'));
    generatedCount++;
    generatedPaths.push(path.relative(process.cwd(), defaultOgPublic));
  }
  seenOgHashes.add(sha256File(defaultOgPublic));
  syncedPublicCount++;
  if (hasDist) {
    const defaultOgDist = path.join(distDir, 'og', 'default.png');
    ensureDir(path.dirname(defaultOgDist));
    fs.copyFileSync(defaultOgPublic, defaultOgDist);
    syncedDistCount++;
  }

  // 4. Per-tool 1200x630 OG banners (regenerate missing, wrong-sized, or duplicate images)
  const tools = await discoverToolsFromFilesystem(options.toolsRoot);
  for (const tool of tools) {
    if (!tool.implemented) continue;

    const toolAssetsDir = path.join(tool.directory, 'assets');
    const sourceOg = path.join(toolAssetsDir, 'og-image.png');

    const exists = fileExists(sourceOg);
    const validSize = exists && isExactPngSize(sourceOg, 1200, 630);
    const currentHash = exists ? sha256File(sourceOg) : '';
    const duplicate = exists && seenOgHashes.has(currentHash);

    if (!exists || !validSize || duplicate) {
      ensureDir(toolAssetsDir);
      fs.writeFileSync(sourceOg, createBrandedOgPng(tool.slug, 1200, 630));
      generatedCount++;
      generatedPaths.push(path.relative(process.cwd(), sourceOg));
    }

    seenOgHashes.add(sha256File(sourceOg));

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
    console.log(`  + updated ${created}`);
  }
}
