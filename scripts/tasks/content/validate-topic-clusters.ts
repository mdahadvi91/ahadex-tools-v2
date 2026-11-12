/**
 * Topic clusters validator. Ensures tools form meaningful topic
 * clusters for SEO authority:
 *   - Tools in the same category (image, pdf) should link to each other
 *   - Each cluster needs at least 2 tools before launch
 *   - No single-tool orphans that cannot rank in a category
 *   - Every cluster has an index page or landing page linking members
 */

import { walkFiles, readText, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { info, warning, type Violation } from '../../utils/validation-result';

interface ToolInfo {
  slug: string;
  category: string;
  internalLinks: string[];
}

function inferCategory(slug: string): string {
  if (slug.startsWith('image-')) return 'image';
  if (slug.includes('pdf')) return 'pdf';
  return 'other';
}

function extractInternalLinks(src: string): string[] {
  const m = src.match(/INTERNAL_LINKS\s*[^=]*=\s*\[([\s\S]*?)\];/);
  if (!m) return [];
  const out: string[] = [];
  const re = /path\s*:\s*['"`]([^'"`]+)['"`]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(m[1])) !== null) {
    out.push(match[1]);
  }
  return out;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const contentFiles = (await walkFiles(PATHS.srcTools, { extensions: ['.ts'] })).filter((f) =>
    f.endsWith('/content.ts'),
  );

  if (contentFiles.length === 0) return violations;

  const tools: ToolInfo[] = [];
  for (const file of contentFiles) {
    const relPath = file
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');
    const slug = relPath.match(/tools\/([^/]+)\//)?.[1] ?? 'unknown';
    const src = await readText(file);
    tools.push({
      slug,
      category: inferCategory(slug),
      internalLinks: extractInternalLinks(src),
    });
  }

  // Group by category.
  const clusters = new Map<string, ToolInfo[]>();
  for (const tool of tools) {
    const list = clusters.get(tool.category) ?? [];
    list.push(tool);
    clusters.set(tool.category, list);
  }

  // Rule 1: each cluster needs at least 2 tools.
  for (const [category, list] of clusters) {
    if (list.length === 1) {
      violations.push(
        warning(
          'cluster-single-tool',
          `Category "${category}" has only 1 tool ("${list[0].slug}"). Add more or reconsider the category.`,
          {
            file: `src/tools/${list[0].slug}/content.ts`,
            hint: 'A single tool cannot anchor a topic cluster for SEO.',
          },
        ),
      );
    } else {
      violations.push(
        info(
          'cluster-ok',
          `Category "${category}" has ${list.length} tools: ${list.map((t) => t.slug).join(', ')}`,
        ),
      );
    }
  }

  // Rule 2: tools in a cluster should cross-link.
  for (const [category, list] of clusters) {
    if (list.length < 2) continue;
    for (const tool of list) {
      const siblingPaths = list.filter((t) => t.slug !== tool.slug).map((t) => `/tools/${t.slug}`);
      const linkedSiblings = siblingPaths.filter((p) => tool.internalLinks.includes(p));
      if (linkedSiblings.length === 0) {
        violations.push(
          warning(
            'cluster-no-cross-links',
            `Tool "${tool.slug}" does not link to any other "${category}" tool.`,
            {
              file: `src/tools/${tool.slug}/content.ts`,
              hint: 'Add cross-links within the cluster to strengthen topical authority.',
            },
          ),
        );
      }
    }
  }

  // Rule 3: cluster index page exists.
  const toolsIndexPath = `${PATHS.srcPages}/Tools.tsx`;
  if (await pathExists(toolsIndexPath)) {
    const src = await readText(toolsIndexPath);
    if (!/getToolRoutes|toolRoutes/.test(src)) {
      violations.push(
        warning(
          'cluster-no-index',
          'Tools.tsx does not use the tool registry. Cluster index may be broken.',
          { file: 'src/pages/Tools.tsx' },
        ),
      );
    }
  }

  return violations;
}
