/**
 * Sitemap generator. Reads tool manifests and static routes, emits
 * public/sitemap.xml. Also usable as a CLI:
 *   tsx scripts/tasks/indexing/generate-sitemap.ts
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Load .env from project root if present (tsx does not auto-load).
const ENV_PATH = join(process.cwd(), '.env');
if (existsSync(ENV_PATH) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(ENV_PATH);
}

import { writeText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { discoverTools } from '../../utils/route-discovery';

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export interface StaticRoute {
  path: string;
  changefreq?: SitemapEntry['changefreq'];
  priority?: number;
}

/**
 * Static routes that always appear in the sitemap. Tool routes are
 * appended from discovered manifests.
 */
export const STATIC_ROUTES: readonly StaticRoute[] = [
  { path: '/', changefreq: 'weekly', priority: 1.0 },
  { path: '/tools', changefreq: 'weekly', priority: 0.9 },
  { path: '/about', changefreq: 'monthly', priority: 0.5 },
  { path: '/contact', changefreq: 'monthly', priority: 0.5 },
  { path: '/privacy', changefreq: 'yearly', priority: 0.3 },
  { path: '/terms', changefreq: 'yearly', priority: 0.3 },
  { path: '/disclaimer', changefreq: 'yearly', priority: 0.3 },
  { path: '/cookies', changefreq: 'yearly', priority: 0.3 },
];

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getSiteUrl(): string {
  const url = process.env.VITE_SITE_URL?.trim();
  if (!url) {
    throw new Error(
      'VITE_SITE_URL is required to generate sitemap. ' +
        'Set it in .env or CI environment.',
    );
  }
  return url.replace(/\/+$/, '');
}

function joinUrl(base: string, path: string): string {
  if (path === '/' || path === '') return `${base}/`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function buildEntry(entry: SitemapEntry): string {
  const parts = [`<loc>${escapeXml(entry.loc)}</loc>`];
  if (entry.lastmod) parts.push(`<lastmod>${entry.lastmod}</lastmod>`);
  if (entry.changefreq) parts.push(`<changefreq>${entry.changefreq}</changefreq>`);
  if (entry.priority !== undefined) {
    parts.push(`<priority>${entry.priority.toFixed(1)}</priority>`);
  }
  return `  <url>\n    ${parts.join('\n    ')}\n  </url>`;
}

function buildSitemapXml(entries: SitemapEntry[]): string {
  const header =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  const body = entries.map(buildEntry).join('\n');
  return `${header}${body}\n</urlset>\n`;
}

/**
 * Builds the full list of sitemap entries from static routes plus
 * discovered tool manifests (only those with sitemap: true and
 * status: 'live' and indexable: true).
 */
export async function buildEntries(): Promise<SitemapEntry[]> {
  const siteUrl = getSiteUrl();
  const today = new Date().toISOString().slice(0, 10);

  const entries: SitemapEntry[] = [];

  for (const route of STATIC_ROUTES) {
    entries.push({
      loc: joinUrl(siteUrl, route.path),
      lastmod: today,
      changefreq: route.changefreq,
      priority: route.priority,
    });
  }

  const { tools, errors } = await discoverTools();
  if (errors.length > 0) {
    for (const e of errors) {
      console.warn(`[sitemap] warning: ${e}`);
    }
  }

  const eligible = tools
    .filter(
      (t) =>
        t.manifest.sitemap === true &&
        t.manifest.indexable === true &&
        t.manifest.status === 'live',
    )
    .sort((a, b) => a.manifest.launchOrder - b.manifest.launchOrder);

  for (const tool of eligible) {
    entries.push({
      loc: joinUrl(siteUrl, tool.manifest.path),
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.8,
    });
  }

  return entries;
}

/**
 * Generates and writes public/sitemap.xml. Returns entry count.
 */
export async function generateSitemap(): Promise<number> {
  const entries = await buildEntries();
  const xml = buildSitemapXml(entries);
  await writeText(PATHS.publicSitemap, xml);
  return entries.length;
}

/**
 * Validator-compatible wrapper. The sitemap is a generated artifact,
 * so this task always regenerates it and then reports success or a
 * clear error. It never fails silently.
 */
export async function run(): Promise<import('../../utils/validation-result').Violation[]> {
  const { error, info } = await import('../../utils/validation-result');
  try {
    const count = await generateSitemap();
    return [
      info('sitemap-generated', `Wrote ${count} entries to public/sitemap.xml.`, {
        file: 'public/sitemap.xml',
      }),
    ];
  } catch (err) {
    return [
      error(
        'sitemap-generation-failed',
        err instanceof Error ? err.message : String(err),
        {
          file: 'public/sitemap.xml',
          hint: 'Ensure VITE_SITE_URL is set and tool manifests are valid.',
        },
      ),
    ];
  }
}

/* CLI entry. Only runs when invoked directly. */
const isDirectInvocation =
  typeof process !== 'undefined' &&
  process.argv[1] !== undefined &&
  process.argv[1].endsWith('generate-sitemap.ts');

if (isDirectInvocation) {
  generateSitemap()
    .then((count) => {
      console.log(`[sitemap] wrote ${count} entries to public/sitemap.xml`);
      process.exit(0);
    })
    .catch((err: unknown) => {
      console.error(
        '[sitemap] failed:',
        err instanceof Error ? err.message : String(err),
      );
      process.exit(1);
    });
}
