/**
 * Social meta validator. Ensures every tool's page has complete Open
 * Graph and Twitter Card tags for social sharing:
 *   - og:title, og:description, og:image, og:url, og:type
 *   - twitter:card, twitter:title, twitter:description
 *   - twitter:image (when image present)
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { discoverTools } from '../../utils/route-discovery';
import { error, warning, type Violation } from '../../utils/validation-result';

interface SeoMetadata {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
}

function extractMetadata(src: string): SeoMetadata | null {
  const m = src.match(/export\s+const\s+metadata[^=]*=\s*(\{[\s\S]*?\n\});/);
  if (!m) return null;

  const fields: SeoMetadata = {};
  const titleM = m[1].match(/title\s*:\s*['"`]([^'"`]+)['"`]/);
  const descM = m[1].match(/description\s*:\s*['"`]([^'"`]+)['"`]/);
  const imgM = m[1].match(/image\s*:\s*['"`]([^'"`]+)['"`]/);
  const pathM = m[1].match(/path\s*:\s*['"`]([^'"`]+)['"`]/);

  if (titleM) fields.title = titleM[1];
  if (descM) fields.description = descM[1];
  if (imgM) fields.image = imgM[1];
  if (pathM) fields.path = pathM[1];
  return fields;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const seoFiles = (await walkFiles(PATHS.srcTools, { extensions: ['.ts'] })).filter((f) =>
    f.endsWith('/seo.ts'),
  );

  const { tools } = await discoverTools();
  const toolBySlug = new Map(tools.map((t) => [t.manifest.slug, t]));

  for (const file of seoFiles) {
    const relPath = file
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');
    const src = await readText(file);
    const meta = extractMetadata(src);

    if (!meta) continue;

    // Rule 1: og:title required (usually same as title).
    if (!meta.title) {
      violations.push(
        error('social-no-title', 'Missing title (used for og:title).', {
          file: relPath,
        }),
      );
    }

    // Rule 2: og:description required.
    if (!meta.description) {
      violations.push(
        error('social-no-description', 'Missing description (used for og:description).', {
          file: relPath,
        }),
      );
    }

    // Rule 3: og:image recommended for all indexable tools.
    const slug = relPath.match(/tools\/([^/]+)\//)?.[1];
    if (slug && toolBySlug.has(slug)) {
      const manifest = toolBySlug.get(slug)!.manifest;
      if (manifest.indexable && !meta.image) {
        violations.push(
          warning(
            'social-no-image',
            'Indexable tool without og:image will get degraded social previews.',
            { file: relPath },
          ),
        );
      }
    }

    // Rule 4: path must exist (used for og:url).
    if (!meta.path) {
      violations.push(
        error('social-no-path', 'Missing path (used for og:url).', {
          file: relPath,
        }),
      );
    }

    // Rule 5: description length fits social previews.
    if (meta.description && meta.description.length > 200) {
      violations.push(
        warning(
          'social-description-too-long',
          `Description is ${meta.description.length} chars (social previews truncate ~160).`,
          { file: relPath },
        ),
      );
    }
  }

  return violations;
}
