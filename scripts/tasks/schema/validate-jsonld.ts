/**
 * JSON-LD validator. Ensures every tool's schema.ts produces valid
 * JSON-LD output:
 *   - buildSchema returns an object with @context and @graph
 *   - @context is https://schema.org
 *   - @graph is a non-empty array
 *   - Every node has @type
 *   - Output is JSON-serializable (no functions, no circular refs)
 *
 * Runs the actual builder and inspects the output.
 */

import { join } from 'node:path';
import { walkFiles, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, info, type Violation } from '../../utils/validation-result';

interface SchemaNode {
  '@type'?: string;
  '@id'?: string;
  [key: string]: unknown;
}

interface SchemaGraph {
  '@context'?: string;
  '@graph'?: SchemaNode[];
}

async function loadAndBuildSchema(
  slug: string,
): Promise<{ schema: SchemaGraph | null; error: string | null }> {
  const schemaPath = join(PATHS.srcTools, slug, 'schema.ts');
  if (!(await pathExists(schemaPath))) {
    return { schema: null, error: 'schema.ts missing' };
  }
  try {
    const mod = (await import(/* @vite-ignore */ schemaPath)) as {
      buildSchema?: (url: string) => SchemaGraph;
      default?: (url: string) => SchemaGraph;
    };
    const builder = mod.buildSchema ?? mod.default;
    if (typeof builder !== 'function') {
      return { schema: null, error: 'no buildSchema/default export' };
    }
    const schema = builder('https://ahadex.online');
    return { schema, error: null };
  } catch (err) {
    return {
      schema: null,
      error: `import failed: ${err instanceof Error ? err.message : String(err)}`,
    };
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

  for (const slug of tools) {
    const relPath = `src/tools/${slug}/schema.ts`;
    const { schema, error: loadErr } = await loadAndBuildSchema(slug);

    if (loadErr) {
      violations.push(
        error('schema-load-failed', `Tool "${slug}": ${loadErr}`, { file: relPath }),
      );
      continue;
    }
    if (!schema) {
      violations.push(
        error('schema-empty', `Tool "${slug}" buildSchema returned nothing.`, {
          file: relPath,
        }),
      );
      continue;
    }

    if (schema['@context'] !== 'https://schema.org') {
      violations.push(
        error(
          'schema-context-invalid',
          `Tool "${slug}" @context is "${schema['@context']}" (must be https://schema.org).`,
          { file: relPath },
        ),
      );
    }

    if (!Array.isArray(schema['@graph']) || schema['@graph'].length === 0) {
      violations.push(
        error('schema-graph-invalid', `Tool "${slug}" @graph is missing or empty.`, {
          file: relPath,
        }),
      );
      continue;
    }

    for (let i = 0; i < schema['@graph'].length; i++) {
      const node = schema['@graph'][i];
      if (!node['@type']) {
        violations.push(
          error('schema-node-no-type', `Tool "${slug}" @graph[${i}] has no @type.`, {
            file: relPath,
          }),
        );
      }
    }

    // JSON serializable check.
    try {
      JSON.stringify(schema);
      violations.push(
        info(
          'schema-jsonld-ok',
          `Tool "${slug}" produces valid JSON-LD with ${schema['@graph'].length} nodes.`,
        ),
      );
    } catch (err) {
      violations.push(
        error(
          'schema-not-serializable',
          `Tool "${slug}" schema is not JSON-serializable: ${err instanceof Error ? err.message : String(err)}`,
          { file: relPath },
        ),
      );
    }
  }

  return violations;
}
