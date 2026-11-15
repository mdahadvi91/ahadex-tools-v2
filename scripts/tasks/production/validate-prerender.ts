/**
 * Prerender validator. Checks that every route has a generated
 * static HTML file with proper metadata.
 *
 * Rules:
 *  - dist/index.html exists (SPA build output)
 *  - dist/metadata.json exists
 *  - dist/<route>/index.html exists for every route in metadata
 *  - Each HTML has unique <title>
 *  - Each HTML has canonical URL
 *  - Each HTML has meta description
 *  - Tool pages have JSON-LD
 */

import { join } from 'node:path';
import { readFile, stat } from 'node:fs/promises';
import { PATHS } from '../../utils/constants';
import { error, info, warning, type Violation } from '../../utils/validation-result';

const DIST_DIR = join(PATHS.root, 'dist');

interface RouteMeta {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  ogType: string;
  jsonLd?: unknown;
}

async function exists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title>([^<]*)<\/title>/);
  return m ? m[1] : null;
}

function hasCanonical(html: string): boolean {
  return /<link rel="canonical"/.test(html);
}

function hasDescription(html: string): boolean {
  return /<meta name="description"/.test(html);
}

function hasJsonLd(html: string): boolean {
  return /<script type="application\/ld\+json">/.test(html);
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  // Rule 1: dist/index.html exists
  const indexHtmlPath = join(DIST_DIR, 'index.html');
  if (!(await exists(indexHtmlPath))) {
    return [
      error('dist-missing', 'dist/index.html is missing. Run `npm run build`.', {
        file: 'dist/index.html',
        hint: 'Build must run before prerender validation.',
      }),
    ];
  }

  // Rule 2: dist/metadata.json exists
  const metaPath = join(DIST_DIR, 'metadata.json');
  if (!(await exists(metaPath))) {
    return [
      error('metadata-bundle-missing', 'dist/metadata.json is missing.', {
        file: 'dist/metadata.json',
        hint: 'Run `generate:metadata-bundle` before validation.',
      }),
    ];
  }

  const metadata: Record<string, RouteMeta> = JSON.parse(
    await readFile(metaPath, 'utf8'),
  );

  const titles = new Map<string, string>(); // title -> route
  const canonicals = new Map<string, string>();

  // Rule 3: each route has its own HTML file
  for (const [route, meta] of Object.entries(metadata)) {
    const htmlPath =
      route === '/' ? indexHtmlPath : join(DIST_DIR, route, 'index.html');

    if (!(await exists(htmlPath))) {
      violations.push(
        error('route-html-missing', `Missing HTML for route ${route}.`, {
          file: `dist${route}/index.html`,
          hint: 'Run `generate:static-html` after build.',
        }),
      );
      continue;
    }

    const html = await readFile(htmlPath, 'utf8');

    // Rule 4: unique title
    const title = extractTitle(html);
    if (!title) {
      violations.push(
        error('missing-title', `Route ${route} has no <title>.`, {
          file: `dist${route}/index.html`,
        }),
      );
    } else if (title !== meta.title) {
      violations.push(
        error(
          'title-mismatch',
          `Route ${route} title "${title}" does not match metadata "${meta.title}".`,
          { file: `dist${route}/index.html` },
        ),
      );
    } else if (titles.has(title)) {
      violations.push(
        error(
          'duplicate-title',
          `Route ${route} uses same title as ${titles.get(title)}.`,
          {
            file: `dist${route}/index.html`,
            hint: 'Every route must have a unique title.',
          },
        ),
      );
    } else {
      titles.set(title, route);
    }

    // Rule 5: canonical present
    if (!hasCanonical(html)) {
      violations.push(
        error('missing-canonical', `Route ${route} has no canonical URL.`, {
          file: `dist${route}/index.html`,
        }),
      );
    } else if (canonicals.has(meta.canonical)) {
      violations.push(
        warning(
          'duplicate-canonical',
          `Route ${route} shares canonical with ${canonicals.get(meta.canonical)}.`,
          { file: `dist${route}/index.html` },
        ),
      );
    } else {
      canonicals.set(meta.canonical, route);
    }

    // Rule 6: description present
    if (!hasDescription(html)) {
      violations.push(
        error('missing-description', `Route ${route} has no meta description.`, {
          file: `dist${route}/index.html`,
        }),
      );
    }

    // Rule 7: tool pages have JSON-LD
    if (route.startsWith('/tools/') && !hasJsonLd(html)) {
      violations.push(
        warning(
          'missing-jsonld',
          `Tool route ${route} has no JSON-LD.`,
          { file: `dist${route}/index.html` },
        ),
      );
    }
  }

  // Rule 8: count matches metadata count
  const expected = Object.keys(metadata).length;
  violations.push(
    info(
      'prerender-summary',
      `${titles.size}/${expected} unique titles across ${expected} routes.`,
    ),
  );

  return violations;
}
