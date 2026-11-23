/**
 * Backwards-compatible CLI delegate pointing to scripts/sitemap/generate-sitemap.ts.
 */

import { generateSitemapFiles } from '../sitemap/generate-sitemap';

const result = await generateSitemapFiles();
console.log(
  `[PASS] sitemap:generate — wrote ${result.urlCount} URLs to ${result.writtenFiles.join(', ')}.`,
);
