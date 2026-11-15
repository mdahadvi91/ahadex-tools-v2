/**
 * Generate a unique SVG icon per live tool.
 * Output: public/icons/<slug>.svg
 *
 * Icons use the tool's accent color and initial letter for a
 * distinct but consistent visual identity.
 */

import { join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { discoverTools } from '../../utils/route-discovery';
import { PATHS } from '../../utils/constants';
import { logger } from '../../utils/logger';

const OUTPUT_DIR = join(PATHS.public, 'icons');

const ACCENTS: Record<string, string> = {
  'image-compressor': '#2563eb',
  'image-resizer': '#7c3aed',
  'merge-pdf': '#dc2626',
  'split-pdf': '#ea580c',
  'pdf-compressor': '#0891b2',
};

function initialsFromTitle(title: string): string {
  const words = title.split(/[\s-]+/).filter((w) => w.length > 0);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function renderIcon(slug: string, title: string): string {
  const accent = ACCENTS[slug] ?? '#2563eb';
  const initials = initialsFromTitle(title);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="12" fill="${accent}"/>
  <text x="32" y="42" font-family="ui-sans-serif, system-ui, sans-serif" font-size="24" font-weight="700" text-anchor="middle" fill="#ffffff">${initials}</text>
</svg>
`;
}

export async function run(): Promise<void> {
  logger.heading('Generating tool icons');
  await mkdir(OUTPUT_DIR, { recursive: true });

  const { tools } = await discoverTools();
  const liveTools = tools.filter((t) => t.manifest.status === 'live');

  for (const tool of liveTools) {
    const slug = tool.manifest.slug;
    const path = join(OUTPUT_DIR, `${slug}.svg`);
    await writeFile(path, renderIcon(slug, tool.manifest.title), 'utf8');
    logger.success(`icon: ${slug}.svg`);
  }

  logger.success(`${liveTools.length} icon(s) generated.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((err) => {
    logger.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
