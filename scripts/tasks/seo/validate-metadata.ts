/**
 * Metadata validator. Ensures every tool declares valid SEO metadata:
 *   - title 40-70 characters (rendering limit)
 *   - description 100-160 characters
 *   - path matches manifest
 *   - no duplicate titles across tools
 *   - noIndex flag consistent with manifest
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { discoverTools } from '../../utils/route-discovery';
import { error, warning, type Violation } from '../../utils/validation-result';

interface MetadataShape {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
}

/** Parses the metadata object literal from a seo.ts file. */
function extractMetadata(src: string): MetadataShape | null {
  // Match: export const metadata: PageMetadata = { ... };
  const m = src.match(/export\s+const\s+metadata[^=]*=\s*(\{[\s\S]*?\n\});/);
  if (!m) return null;

  const fields: MetadataShape = {};
  const titleM = m[1].match(/title\s*:\s*['"`]([^'"`]+)['"`]/);
  const descM = m[1].match(/description\s*:\s*['"`]([^'"`]+)['"`]/);
  const pathM = m[1].match(/path\s*:\s*['"`]([^'"`]+)['"`]/);
  const noIndexM = m[1].match(/noIndex\s*:\s*(true|false)/);

  if (titleM) fields.title = titleM[1];
  if (descM) fields.description = descM[1];
  if (pathM) fields.path = pathM[1];
  if (noIndexM) fields.noIndex = noIndexM[1] === 'true';
  return fields;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  if (!(await walkFiles(PATHS.srcTools, { extensions: ['.ts'] })).length) {
    return violations;
  }

  const seoFiles = (await walkFiles(PATHS.srcTools, { extensions: ['.ts'] })).filter((f) =>
    f.endsWith('/seo.ts'),
  );
  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();
  const { tools } = await discoverTools();
  const toolBySlug = new Map(tools.map((t) => [t.manifest.slug, t]));

  for (const file of seoFiles) {
    const relPath = file
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');
    const src = await readText(file);
    const meta = extractMetadata(src);

    if (!meta) {
      violations.push(
        error('metadata-not-found', 'seo.ts does not export a "metadata" object.', {
          file: relPath,
        }),
      );
      continue;
    }

    if (!meta.title) {
      violations.push(
        error('metadata-no-title', 'metadata.title is missing.', {
          file: relPath,
        }),
      );
    } else if (meta.title.length < 40 || meta.title.length > 70) {
      violations.push(
        warning('metadata-title-length', `Title is ${meta.title.length} chars (target 40-70).`, {
          file: relPath,
          hint: 'Longer titles may be truncated in search results.',
        }),
      );
    }

    if (!meta.description) {
      violations.push(
        error('metadata-no-description', 'metadata.description is missing.', {
          file: relPath,
        }),
      );
    } else if (meta.description.length < 100 || meta.description.length > 160) {
      violations.push(
        warning(
          'metadata-description-length',
          `Description is ${meta.description.length} chars (target 100-160).`,
          { file: relPath },
        ),
      );
    }

    // Check against manifest.
    const slug = relPath.match(/tools\/([^/]+)\//)?.[1];
    if (slug && toolBySlug.has(slug)) {
      const manifest = toolBySlug.get(slug)!.manifest;
      if (meta.path && meta.path !== manifest.path) {
        violations.push(
          error(
            'metadata-path-mismatch',
            `metadata.path "${meta.path}" does not match manifest.path "${manifest.path}".`,
            { file: relPath },
          ),
        );
      }
      if (manifest.indexable && meta.noIndex) {
        violations.push(
          error('metadata-noindex-conflict', 'Manifest says indexable but metadata sets noIndex.', {
            file: relPath,
          }),
        );
      }
    }

    // Duplicate detection.
    if (meta.title) {
      if (titles.has(meta.title)) {
        violations.push(
          error(
            'duplicate-title',
            `Title "${meta.title}" is also used by ${titles.get(meta.title)}.`,
            { file: relPath },
          ),
        );
      } else {
        titles.set(meta.title, relPath);
      }
    }
    if (meta.description) {
      if (descriptions.has(meta.description)) {
        violations.push(
          error(
            'duplicate-description',
            `Description duplicates ${descriptions.get(meta.description)}.`,
            { file: relPath },
          ),
        );
      } else {
        descriptions.set(meta.description, relPath);
      }
    }
  }

  return violations;
}
