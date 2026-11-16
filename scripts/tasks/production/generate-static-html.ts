/**
 * Generate static HTML shells for every route with metadata injected.
 *
 * Reads dist/index.html (Vite SPA shell) and dist/metadata.json bundle,
 * then writes dist/<route>/index.html for every route with the correct
 * <title>, <meta>, canonical, OG, Twitter, and JSON-LD.
 *
 * The <div id="root"></div> remains empty - React hydrates on client.
 * This gives AdSense/Google a fully described HTML document without
 * requiring server-side React rendering.
 */

import { join, dirname } from 'node:path';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { PATHS } from '../../utils/constants';
import { logger } from '../../utils/logger';

const DIST_DIR = join(PATHS.root, 'dist');
const SPA_HTML_PATH = join(DIST_DIR, 'index.html');
const METADATA_PATH = join(DIST_DIR, 'metadata.json');

interface RouteMeta {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  ogType: string;
  jsonLd?: unknown;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHeadTags(meta: RouteMeta): string {
  const tags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`,
    `<meta property="og:type" content="${escapeHtml(meta.ogType)}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.canonical)}" />`,
    `<meta property="og:image" content="${escapeHtml(meta.ogImage)}" />`,
    `<meta property="og:site_name" content="AHADEX Tools" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(meta.ogImage)}" />`,
  ];

  if (meta.jsonLd) {
    tags.push(
      `<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>`,
    );
  }

  return tags.join('\n    ');
}

function injectIntoHtml(spaHtml: string, meta: RouteMeta): string {
  // Replace <title>AHADEX Tools</title> with metadata-injected head
  let html = spaHtml.replace(
    /<title>[^<]*<\/title>/,
    '',
  );
  // Inject after <meta name="viewport" ... />
  html = html.replace(
    /(<meta name="viewport"[^>]*\/>)/,
    `$1\n    ${buildHeadTags(meta)}`,
  );
  return html;
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

export async function run(): Promise<void> {
  logger.heading('Generating static HTML per route');

  if (!(await pathExists(SPA_HTML_PATH))) {
    logger.error('dist/index.html not found. Run vite build first.');
    process.exit(1);
  }
  if (!(await pathExists(METADATA_PATH))) {
    logger.error('dist/metadata.json not found. Run generate:metadata-bundle first.');
    process.exit(1);
  }

  const spaHtml = await readFile(SPA_HTML_PATH, 'utf8');
  const metadata: Record<string, RouteMeta> = JSON.parse(
    await readFile(METADATA_PATH, 'utf8'),
  );

  for (const [route, meta] of Object.entries(metadata)) {
    const html = injectIntoHtml(spaHtml, meta);
    const outputPath =
      route === '/' ? join(DIST_DIR, 'index.html') : join(DIST_DIR, `${route.slice(1)}.html`);

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, html, 'utf8');
    logger.success(`html: ${route}`);
  }

  logger.success(`${Object.keys(metadata).length} static HTML file(s) generated.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((err) => {
    logger.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
