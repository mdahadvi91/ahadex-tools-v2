/**
 * Schema types validator. Ensures every tool uses the expected
 * schema.org types:
 *   - WebApplication for the tool itself
 *   - FAQPage for the FAQ section
 *   - BreadcrumbList for the navigation
 *   - No unknown types (typos would silently fail)
 */

import { join } from 'node:path';
import { walkFiles, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, info, warning, type Violation } from '../../utils/validation-result';

interface SchemaNode {
  '@type'?: string;
  [key: string]: unknown;
}

interface SchemaGraph {
  '@graph'?: SchemaNode[];
}

const EXPECTED_TYPES = ['WebApplication', 'FAQPage', 'BreadcrumbList'];

const KNOWN_TYPES = new Set([
  'WebApplication',
  'WebSite',
  'WebPage',
  'FAQPage',
  'BreadcrumbList',
  'ListItem',
  'Question',
  'Answer',
  'Organization',
  'Person',
  'Offer',
  'ImageObject',
  'SoftwareApplication',
  'HowTo',
  'HowToStep',
]);

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

function collectTypes(node: unknown, acc: Set<string>): void {
  if (node === null || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) collectTypes(item, acc);
    return;
  }
  const obj = node as Record<string, unknown>;
  if (typeof obj['@type'] === 'string') acc.add(obj['@type']);
  for (const key of Object.keys(obj)) {
    if (key === '@type') continue;
    collectTypes(obj[key], acc);
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
    const schema = await loadSchema(slug);
    if (!schema) continue;

    const types = new Set<string>();
    collectTypes(schema, types);

    for (const expected of EXPECTED_TYPES) {
      if (!types.has(expected)) {
        violations.push(
          warning('schema-missing-type', `Tool "${slug}" does not use "${expected}" type.`, {
            file: `src/tools/${slug}/schema.ts`,
            hint: `${expected} improves structured data richness.`,
          }),
        );
      }
    }

    for (const type of types) {
      if (!KNOWN_TYPES.has(type)) {
        violations.push(
          error('schema-unknown-type', `Tool "${slug}" uses unknown schema type "${type}".`, {
            file: `src/tools/${slug}/schema.ts`,
            hint: 'Verify the exact case on schema.org.',
          }),
        );
      }
    }

    violations.push(
      info('schema-types-ok', `Tool "${slug}" uses ${types.size} types: ${[...types].join(', ')}`),
    );
  }

  return violations;
}
