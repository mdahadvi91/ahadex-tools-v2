import fs from 'node:fs';
import path from 'node:path';
import { toolRoutes } from '../../src/router/route-registry';
import { assertValidEnvironment, getEnvironment } from '../../src/config/environment';

assertValidEnvironment();
const env = getEnvironment();
const today = new Date().toISOString().slice(0, 10);

const entries = [
  { loc: `${env.siteUrl}/`, priority: '1.0' },
  ...toolRoutes
    .filter((route) => route.meta.indexable && route.meta.sitemap)
    .map((route) => {
      const cleanPath = route.path.startsWith('/') ? route.path : `/${route.path}`;
      return { loc: `${env.siteUrl}${cleanPath}`, priority: '0.8' };
    }),
];

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...entries.map(
    (item) =>
      `  <url>\n    <loc>${item.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${item.priority}</priority>\n  </url>`,
  ),
  '</urlset>',
  '',
].join('\n');

const outPath = path.resolve('public/sitemap.xml');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, xml, 'utf8');
console.log(`Generated ${outPath} with ${entries.length} URLs.`);
