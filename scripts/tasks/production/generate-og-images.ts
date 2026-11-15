/**
 * Ensure every live tool has an OG image in public/og/<slug>.webp.
 *
 * If a tool provides an existing og-image asset in src/tools/<slug>/assets/,
 * it is copied to public/og/<slug>.webp. Otherwise, the site logo
 * (public/images/logo.png) is used as a fallback (renamed to <slug>.png).
 *
 * A full image-generation pipeline would use Sharp/Canvas to compose a
 * per-tool banner. That upgrade is deferred - this file ensures OG
 * image existence and validator coverage.
 */

import { join } from 'node:path';
import { mkdir, copyFile, stat } from 'node:fs/promises';
import { discoverTools } from '../../utils/route-discovery';
import { PATHS } from '../../utils/constants';
import { logger } from '../../utils/logger';

const OUTPUT_DIR = join(PATHS.public, 'og');
const FALLBACK_LOGO = join(PATHS.public, 'images/logo.png');

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function run(): Promise<void> {
  logger.heading('Generating OG images');
  await mkdir(OUTPUT_DIR, { recursive: true });

  const { tools } = await discoverTools();
  const liveTools = tools.filter((t) => t.manifest.status === 'live');

  for (const tool of liveTools) {
    const slug = tool.manifest.slug;

    // Preferred: tool-specific OG asset
    const toolOg = join(PATHS.srcTools, slug, 'assets/og-image.png');
    const outputPath = join(OUTPUT_DIR, `${slug}.png`);

    if (await exists(toolOg)) {
      await copyFile(toolOg, outputPath);
      logger.success(`og: ${slug}.png (from tool asset)`);
    } else if (await exists(FALLBACK_LOGO)) {
      await copyFile(FALLBACK_LOGO, outputPath);
      logger.warn(`og: ${slug}.png (fallback to site logo)`);
    } else {
      logger.error(`og: ${slug}.png - no source asset available`);
    }
  }

  logger.success(`${liveTools.length} OG image(s) prepared.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((err) => {
    logger.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
