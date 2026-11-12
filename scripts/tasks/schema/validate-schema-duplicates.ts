/**
 * Schema duplicates validator. Ensures no two @id values collide
 * across tools, and no two tools declare the same WebApplication @id.
 *
 * Duplicate @id values confuse search engines about which entity is
 * which and can merge them incorrectly.
 */

import { join } from 'node:path';
import { walkFiles, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, info, type Violation } from '../../utils/validation-result';

interface SchemaGraph {
  '@graph'?: Array<{ '@id'?: string; '@type'?: string }>;
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

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  if (!(await pathExists(PATHS.srcTools))) return violations;

  const indexFiles = (await walkFiles(PATHS.srcTools, { extensions: ['.ts'] })).filter(
    (f) => f.endsWith('/index.ts') && !f.includes('/tests/'),
  );
  const tools = new Set<string>();
  for (const f of indexFiles) {
    const m = f.match(/tools\/([^/]+)\/index\.ts$/);
    if (m) tools.add(m[1]);
  }

  // Track @id → tool slug.
  const seenIds = new Map<string, string>();

  for (const slug of tools) {
    const schema = await loadSchema(slug);
    if (!schema) continue;

    const graph = schema['@graph'] ?? [];
    const seenInTool = new Set<string>();

    for (const node of graph) {
      const id = node['@id'];
      if (!id) continue;

      // Rule 1: no duplicate @id within the same tool.
      if (seenInTool.has(id)) {
        violations.push(
          error('schema-duplicate-id-in-tool', `Tool "${slug}" uses @id "${id}" more than once.`, {
            file: `src/tools/${slug}/schema.ts`,
          }),
        );
      }
      seenInTool.add(id);

      // Rule 2: no duplicate @id across tools.
      const existing = seenIds.get(id);
      if (existing && existing !== slug) {
        violations.push(
          error(
            'schema-duplicate-id-cross-tool',
            `@id "${id}" is used by both "${existing}" and "${slug}".`,
            {
              file: `src/tools/${slug}/schema.ts`,
              hint: '@id must be unique across the whole site.',
            },
          ),
        );
      } else {
        seenIds.set(id, slug);
      }
    }
  }

  violations.push(
    info('schema-duplicates-ok', `${seenIds.size} unique @id values across ${tools.size} tools.`),
  );

  return violations;
}
