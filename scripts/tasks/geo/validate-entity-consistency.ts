/**
 * GEO entity consistency validator. Ensures the same entity
 * description appears in manifest, geo.ts, content.ts and schema —
 * not just for SEO but so LLMs can cite an accurate, consistent
 * description.
 */

import { join } from 'node:path';
import { walkFiles, readText, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { warning, type Violation } from '../../utils/validation-result';

interface ToolDescription {
  manifestDescription: string | null;
  geoDirectAnswer: string | null;
  schemaDescription: string | null;
  contentDescription: string | null;
}

async function extractManifestDescription(slug: string): Promise<string | null> {
  const path = join(PATHS.srcTools, slug, 'manifest.ts');
  if (!(await pathExists(path))) return null;
  const src = await readText(path);
  const m = src.match(/description\s*:\s*['"`]([^'"`]+)['"`]/);
  return m ? m[1] : null;
}

async function extractGeoDirectAnswer(slug: string): Promise<string | null> {
  const path = join(PATHS.srcTools, slug, 'geo.ts');
  if (!(await pathExists(path))) return null;
  const src = await readText(path);
  const m = src.match(/DIRECT_ANSWER\s*=\s*(?:\n\s*)?['"`]([^'"`]+)['"`]/);
  return m ? m[1] : null;
}

async function extractSchemaDescription(slug: string): Promise<string | null> {
  const path = join(PATHS.srcTools, slug, 'schema.ts');
  if (!(await pathExists(path))) return null;
  try {
    const mod = (await import(/* @vite-ignore */ path)) as {
      buildSchema?: (url: string) => { '@graph'?: Array<{ '@type'?: string; description?: string }> };
      default?: (url: string) => { '@graph'?: Array<{ '@type'?: string; description?: string }> };
    };
    const builder = mod.buildSchema ?? mod.default;
    if (typeof builder !== 'function') return null;
    const schema = builder('https://ahadex.online');
    const webApp = schema['@graph']?.find((n) => n['@type'] === 'WebApplication');
    return webApp?.description ?? null;
  } catch {
    return null;
  }
}

async function extractContentDescription(slug: string): Promise<string | null> {
  const path = join(PATHS.srcTools, slug, 'content.ts');
  if (!(await pathExists(path))) return null;
  const src = await readText(path);
  const m = src.match(/DIRECT_ANSWER\s*=\s*(?:\n\s*)?['"`]([^'"`]+)['"`]/);
  return m ? m[1] : null;
}

/** Token-based Jaccard similarity (words only). */
function wordSimilarity(a: string, b: string): number {
  const tokens = (s: string): Set<string> =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3),
    );
  const setA = tokens(a);
  const setB = tokens(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const word of setA) if (setB.has(word)) intersection++;
  return intersection / Math.max(setA.size, setB.size);
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  if (!(await pathExists(PATHS.srcTools))) return violations;

  const indexFiles = (await walkFiles(PATHS.srcTools, { extensions: ['.ts'] })).filter(
    (f) => f.endsWith('/index.ts') && !f.includes('/tests/'),
  );
  const slugs = new Set<string>();
  for (const f of indexFiles) {
    const m = f.match(/tools\/([^/]+)\/index\.ts$/);
    if (m) slugs.add(m[1]);
  }

  for (const slug of slugs) {
    const d: ToolDescription = {
      manifestDescription: await extractManifestDescription(slug),
      geoDirectAnswer: await extractGeoDirectAnswer(slug),
      schemaDescription: await extractSchemaDescription(slug),
      contentDescription: await extractContentDescription(slug),
    };

    const values = [d.manifestDescription, d.geoDirectAnswer, d.contentDescription].filter(
      (v): v is string => v !== null,
    );
    if (values.length < 2) continue;

    // Compare every pair — must be at least 40% similar (same topic).
    for (let i = 0; i < values.length; i++) {
      for (let j = i + 1; j < values.length; j++) {
        const sim = wordSimilarity(values[i], values[j]);
        if (sim < 0.4) {
          violations.push(
            warning(
              'entity-description-divergence',
              `Tool "${slug}": descriptions diverge (similarity ${Math.round(sim * 100)}%).`,
              {
                file: `src/tools/${slug}/`,
                hint: 'Manifest, geo and content descriptions should convey the same entity.',
              },
            ),
          );
        }
      }
    }

    // Tool name must appear consistently.
    const names = [
      d.manifestDescription,
      d.geoDirectAnswer,
      d.contentDescription,
    ].filter((v): v is string => v !== null);

    if (names.length > 0) {
      const firstWordOfNames = names.map((n) => n.split(/\s+/)[0]?.toLowerCase());
      const uniqueFirstWords = new Set(firstWordOfNames);
      if (uniqueFirstWords.size > 1) {
        violations.push(
          warning(
            'entity-name-mismatch',
            `Tool "${slug}" descriptions start with different entities: ${[...uniqueFirstWords].join(', ')}`,
            {
              file: `src/tools/${slug}/`,
              hint: 'Start every description with the tool name for consistency.',
            },
          ),
        );
      }
    }
  }

  return violations;
}
