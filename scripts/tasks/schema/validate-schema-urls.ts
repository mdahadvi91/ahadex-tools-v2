/**
 * Schema URLs validator. Ensures all URLs in JSON-LD output are:
 *   - Absolute (start with https://)
 *   - Match the site origin (VITE_SITE_URL)
 *   - Use the tool's canonical path
 *   - Do not contain query parameters or hash fragments
 */

import { join } from 'node:path';
import { walkFiles, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, info, warning, type Violation } from '../../utils/validation-result';

interface SchemaGraph {
  [key: string]: unknown;
}

function getSiteUrl(): string | null {
  const url = process.env.VITE_SITE_URL?.trim();
  if (!url) return null;
  return url.replace(/\/+$/, '');
}

async function loadSchema(slug: string): Promise<SchemaGraph | null> {
  const schemaPath = join(PATHS.srcTools, slug, 'schema.ts');
  if (!(await pathExists(schemaPath))) return null;
  try {
    const mod = (await import(/* @vite-ignore */ schemaPath)) as {
      buildSchema?: (url: string) => SchemaGraph;
      default?: (url: string) => SchemaGraph;
    };
    const builder = mod.buildSchema ?? mod.default;
    if (typeof builder !== 'function') return null;
    return builder('https://ahadex.online');
  } catch {
    return null;
  }
}

/** Walks the object and collects all string values that look like URLs. */
function collectUrls(node: unknown, acc: string[]): void {
  if (typeof node === 'string') {
    if (/^https?:\/\//.test(node)) acc.push(node);
    return;
  }
  if (node === null || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) collectUrls(item, acc);
    return;
  }
  for (const value of Object.values(node as Record<string, unknown>)) {
    collectUrls(value, acc);
  }
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  if (!(await pathExists(PATHS.srcTools))) return violations;

  const siteUrl = getSiteUrl();
  if (!siteUrl) {
    return [
      warning('schema-urls-no-site-url', 'VITE_SITE_URL is not set. Cannot validate schema URLs.'),
    ];
  }

  const indexFiles = (await walkFiles(PATHS.srcTools, { extensions: ['.ts'] })).filter(
    (f) => f.endsWith('/index.ts') && !f.includes('/tests/'),
  );
  const tools = new Set<string>();
  for (const f of indexFiles) {
    const m = f.match(/tools\/([^/]+)\/index\.ts$/);
    if (m) tools.add(m[1]);
  }

  for (const slug of tools) {
    const schema = await loadSchema(slug);
    if (!schema) continue;

    const urls: string[] = [];
    collectUrls(schema, urls);

    for (const url of urls) {
      if (!url.startsWith('https://')) {
        violations.push(
          error('schema-url-not-https', `Tool "${slug}" schema has non-HTTPS URL: ${url}`, {
            file: `src/tools/${slug}/schema.ts`,
          }),
        );
        continue;
      }

      if (url.includes('?') || url.includes('#')) {
        violations.push(
          warning('schema-url-has-params', `Tool "${slug}" schema URL has query or hash: ${url}`, {
            file: `src/tools/${slug}/schema.ts`,
            hint: 'Canonical URLs should not include query parameters.',
          }),
        );
      }

      // Schema URLs must belong to the site origin (except schema.org references).
      if (!url.startsWith(siteUrl) && !url.startsWith('https://schema.org')) {
        violations.push(
          warning(
            'schema-url-external',
            `Tool "${slug}" schema URL is outside site origin: ${url}`,
            { file: `src/tools/${slug}/schema.ts` },
          ),
        );
      }
    }

    // Rule: the tool's own URL must appear in the schema.
    const expectedToolUrl = `${siteUrl}/tools/${slug}`;
    if (!urls.includes(expectedToolUrl)) {
      violations.push(
        error(
          'schema-missing-tool-url',
          `Tool "${slug}" schema does not include its own URL: ${expectedToolUrl}`,
          {
            file: `src/tools/${slug}/schema.ts`,
            hint: 'WebApplication.url should be the tool page URL.',
          },
        ),
      );
    }

    violations.push(
      info('schema-urls-ok', `Tool "${slug}" schema has ${urls.length} URLs, all validated.`),
    );
  }

  return violations;
}
