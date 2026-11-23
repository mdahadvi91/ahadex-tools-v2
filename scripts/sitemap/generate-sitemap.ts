/**
 * XML Sitemap generator backed by filesystem route discovery.
 * Emits sitemap entries only for routes where both `indexable` and `sitemap`
 * are true, enforces canonical trailing-slash HTTPS URLs, and writes to
 * both `public/sitemap.xml` and `dist/sitemap.xml` (if built).
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_CONFIG } from '../../config/site.config';
import { fileExists, resolveFromRoot, writeTextFile } from '../utils/file-utils';
import { discoverPublishedRoutes, type DiscoveredRoute } from '../utils/route-discovery';

export interface SitemapGenerationResult {
  readonly generatedAt: string;
  readonly urlCount: number;
  readonly urls: readonly string[];
  readonly writtenFiles: readonly string[];
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function buildSitemapXml(routes: readonly DiscoveredRoute[], lastmod: string): string {
  const included = routes
    .filter((route) => route.indexable && route.sitemap)
    .sort((a, b) => Number(b.priority) - Number(a.priority) || a.path.localeCompare(b.path));

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...included.map((route) => {
      const changefreq =
        route.path === '/' ? 'weekly' : route.kind === 'tool' ? 'weekly' : 'monthly';
      return [
        '  <url>',
        `    <loc>${escapeXml(route.canonicalUrl)}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${route.priority}</priority>`,
        '  </url>',
      ].join('\n');
    }),
    '</urlset>',
    '',
  ];

  return lines.join('\n');
}

export async function generateSitemapFiles(
  options: {
    toolsRoot?: string;
    publicSitemapPath?: string;
    distDir?: string;
  } = {},
): Promise<SitemapGenerationResult> {
  const routes = await discoverPublishedRoutes(options.toolsRoot);
  const lastmod = new Date().toISOString().slice(0, 10);
  const xml = buildSitemapXml(routes, lastmod);

  const includedUrls = routes.filter((r) => r.indexable && r.sitemap).map((r) => r.canonicalUrl);

  const publicOut = options.publicSitemapPath ?? resolveFromRoot('public', 'sitemap.xml');
  writeTextFile(publicOut, xml);
  const writtenFiles: string[] = [path.relative(process.cwd(), publicOut)];

  const distDir = options.distDir ?? resolveFromRoot('dist');
  if (fileExists(distDir)) {
    const distOut = path.join(distDir, 'sitemap.xml');
    writeTextFile(distOut, xml);
    writtenFiles.push(path.relative(process.cwd(), distOut));
  }

  // Ensure URLs strictly reference authoritative origin.
  for (const url of includedUrls) {
    if (!url.startsWith(SITE_CONFIG.origin)) {
      throw new Error(`Unexpected sitemap URL origin: ${url}`);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    urlCount: includedUrls.length,
    urls: includedUrls,
    writtenFiles,
  };
}

const isDirectExecution =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  const result = await generateSitemapFiles();
  console.log(
    `[PASS] sitemap:generate — wrote ${result.urlCount} URLs to ${result.writtenFiles.join(', ')}.`,
  );
}
