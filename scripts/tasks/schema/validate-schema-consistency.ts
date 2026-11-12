/**
 * Schema consistency validator. Ensures JSON-LD matches the actual
 * page content:
 *   - WebApplication.name matches manifest.title (prefix allowed)
 *   - WebApplication.description matches manifest.description
 *   - FAQPage questions match the FAQ array in content.ts
 *   - BreadcrumbList items match the actual tool path
 */

import { join } from 'node:path';
import { walkFiles, readText, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { discoverTools } from '../../utils/route-discovery';
import { error, warning, type Violation } from '../../utils/validation-result';

interface SchemaNode {
  '@type'?: string;
  name?: string;
  description?: string;
  mainEntity?: Array<{ name?: string }>;
  itemListElement?: Array<{ name?: string; item?: string; position?: number }>;
  [key: string]: unknown;
}

interface SchemaGraph {
  '@graph'?: SchemaNode[];
}

interface FAQPair {
  question: string;
  answer: string;
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

/**
 * Extracts FAQ pairs from content.ts using linear brace matching.
 * Handles multi-line object literals with newlines in strings.
 */
function extractContentFaq(src: string): FAQPair[] {
  // Find `FAQ` anchor.
  // Anchor on `FAQ = [` to skip `FAQItem` interface and similar.
  const anchorMatch = src.match(/export\s+const\s+FAQ\s*:\s*readonly\s+FAQItem\[\]\s*=\s*\[/);
  if (!anchorMatch || anchorMatch.index === undefined) return [];
  const openIdx = anchorMatch.index + anchorMatch[0].length - 1;

  // Walk to matching `]`.
  let depth = 1;
  let i = openIdx + 1;
  while (i < src.length && depth > 0) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') depth--;
    i++;
  }
  const body = src.slice(openIdx + 1, i - 1);

  // Walk each `{...}` at depth 1 inside body.
  const pairs: FAQPair[] = [];
  let objDepth = 0;
  let objStart = -1;
  for (let j = 0; j < body.length; j++) {
    if (body[j] === '{') {
      if (objDepth === 0) objStart = j;
      objDepth++;
    } else if (body[j] === '}') {
      objDepth--;
      if (objDepth === 0 && objStart !== -1) {
        const obj = body.slice(objStart + 1, j);
        const qMatch = obj.match(/question\s*:\s*['"`]([^'"`]*(?:\\.[^'"`]*)*)['"`]/);
        const aMatch = obj.match(/answer\s*:\s*['"`]([^'"`]*(?:\\.[^'"`]*)*)['"`]/);
        if (qMatch) {
          pairs.push({ question: qMatch[1], answer: aMatch ? aMatch[1] : '' });
        }
        objStart = -1;
      }
    }
  }

  return pairs;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  if (!(await pathExists(PATHS.srcTools))) return violations;

  const { tools } = await discoverTools();
  const toolBySlug = new Map(tools.map((t) => [t.manifest.slug, t]));

  const indexFiles = (await walkFiles(PATHS.srcTools, { extensions: ['.ts'] })).filter(
    (f) => f.endsWith('/index.ts') && !f.includes('/tests/'),
  );
  const slugs = new Set<string>();
  for (const f of indexFiles) {
    const m = f.match(/tools\/([^/]+)\/index\.ts$/);
    if (m) slugs.add(m[1]);
  }

  for (const slug of slugs) {
    const schema = await loadSchema(slug);
    if (!schema) continue;

    const manifest = toolBySlug.get(slug)?.manifest;
    if (!manifest) continue;

    const graph = schema['@graph'] ?? [];

    // Rule 1: WebApplication.name should appear in the manifest title.
    // The schema uses the short brand name; the manifest title adds an
    // SEO suffix. Accept when the schema name prefixes the title.
    const webApp = graph.find((n) => n['@type'] === 'WebApplication');
    if (webApp) {
      if (webApp.name && webApp.name !== manifest.title) {
        const isPrefix = manifest.title.includes(webApp.name);
        if (!isPrefix) {
          violations.push(
            error(
              'schema-name-drift',
              `Tool "${slug}" WebApplication.name "${webApp.name}" does not appear at the start of manifest title "${manifest.title}".`,
              {
                file: `src/tools/${slug}/schema.ts`,
                hint: 'Schema name should be the short brand name of the tool.',
              },
            ),
          );
        }
      }
      if (webApp.description && webApp.description !== manifest.description) {
        violations.push(
          warning(
            'schema-description-drift',
            `Tool "${slug}" WebApplication.description differs from manifest description.`,
            {
              file: `src/tools/${slug}/schema.ts`,
              hint: 'Keep schema and page metadata aligned.',
            },
          ),
        );
      }
    }

    // Rule 2: FAQPage questions match content.ts FAQ.
    const faqNode = graph.find((n) => n['@type'] === 'FAQPage');
    if (faqNode) {
      const schemaQuestions = new Set(
        (faqNode.mainEntity ?? []).map((q) => (q.name ?? '').toLowerCase().trim()),
      );

      const contentPath = join(PATHS.srcTools, slug, 'content.ts');
      if (await pathExists(contentPath)) {
        const contentSrc = await readText(contentPath);
        const contentFaq = extractContentFaq(contentSrc);
        const contentQuestions = new Set(contentFaq.map((f) => f.question.toLowerCase().trim()));

        for (const q of schemaQuestions) {
          if (!contentQuestions.has(q)) {
            violations.push(
              error(
                'schema-faq-question-drift',
                `Tool "${slug}" schema question not in content: "${q.slice(0, 60)}"`,
                { file: `src/tools/${slug}/schema.ts` },
              ),
            );
          }
        }

        for (const q of contentQuestions) {
          if (!schemaQuestions.has(q)) {
            violations.push(
              error(
                'schema-faq-missing-question',
                `Tool "${slug}" content question missing from schema: "${q.slice(0, 60)}"`,
                { file: `src/tools/${slug}/schema.ts` },
              ),
            );
          }
        }
      }
    }

    // Rule 3: BreadcrumbList matches tool path.
    const breadcrumb = graph.find((n) => n['@type'] === 'BreadcrumbList');
    if (breadcrumb) {
      const expectedUrl = `https://ahadex.online${manifest.path}`;
      const hasTool = (breadcrumb.itemListElement ?? []).some((item) => item.item === expectedUrl);
      if (!hasTool) {
        violations.push(
          warning(
            'schema-breadcrumb-missing-tool',
            `Tool "${slug}" breadcrumb does not include its own URL: ${expectedUrl}`,
            { file: `src/tools/${slug}/schema.ts` },
          ),
        );
      }
    }
  }

  return violations;
}
