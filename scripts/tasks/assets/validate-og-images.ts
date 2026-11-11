/**
 * OG image validator. Ensures every tool declares an og:image that
 * actually exists on disk and meets basic size/format rules.
 */

import { join } from 'node:path';
import { readText, pathExists, walkFiles } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, info, warning, type Violation } from '../../utils/validation-result';

const OG_SIZE_MIN = 200 * 1024; // 200 KB min (needs to look sharp on social)
const OG_SIZE_MAX = 5 * 1024 * 1024; // 5 MB max (Twitter/Slack limits)

interface OgReference {
  file: string;
  line: number;
  path: string;
}

function extractOgImageRefs(src: string): OgReference[] {
  const refs: OgReference[] = [];
  // Match: image: '/path/to/image.ext'
  const re = /\bimage\s*:\s*['"](\/[^'"]+\.(?:png|jpe?g|webp|avif|gif))['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    refs.push({ file: '', line: lineNumberAt(src, m.index), path: m[1] });
  }
  return refs;
}

function lineNumberAt(source: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

async function resolvePublicPath(publicPath: string): Promise<string | null> {
  // Strip leading slash; resolve from public/.
  const rel = publicPath.replace(/^\/+/, '');
  const publicCandidate = join(PATHS.public, rel);
  if (await pathExists(publicCandidate)) return publicCandidate;

  // Also check src/tools for tool-specific OG images.
  const toolCandidate = join(PATHS.srcTools, rel.replace(/^tools\//, ''));
  if (await pathExists(toolCandidate)) return toolCandidate;

  return null;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  // Rule 1: every tool's seo.ts must declare an image.
  if (!(await pathExists(PATHS.srcTools))) {
    return violations;
  }

  const seoFiles = await walkFiles(PATHS.srcTools, { extensions: ['.ts'] });
  const seoFilesFiltered = seoFiles.filter((f) => f.endsWith('/seo.ts'));

  for (const file of seoFilesFiltered) {
    const relPath = file.substring(PATHS.root.length + 1).split('\\').join('/');
    const src = await readText(file);
    const refs = extractOgImageRefs(src);

    if (refs.length === 0) {
      violations.push(
        error(
          'og-image-not-declared',
          'Tool SEO metadata does not declare an og:image.',
          {
            file: relPath,
            hint: 'Add image: "/path/to/og.png" to metadata.',
          },
        ),
      );
      continue;
    }

    for (const ref of refs) {
      const resolved = await resolvePublicPath(ref.path);
      if (!resolved) {
        violations.push(
          error(
            'og-image-missing',
            `og:image "${ref.path}" not found.`,
            {
              file: relPath,
              line: ref.line,
              hint: 'The image must exist in public/ or tool assets.',
            },
          ),
        );
        continue;
      }

      // Rule 2: size check (only if it's an actual file we can stat).
      try {
        const fs = await import('node:fs/promises');
        const stat = await fs.stat(resolved);
        if (stat.size < OG_SIZE_MIN) {
          violations.push(
            warning(
              'og-image-too-small',
              `og:image "${ref.path}" is only ${Math.round(stat.size / 1024)} KB.`,
              {
                file: relPath,
                hint: 'Social platforms expect at least 200 KB for sharp previews.',
              },
            ),
          );
        } else if (stat.size > OG_SIZE_MAX) {
          violations.push(
            error(
              'og-image-too-large',
              `og:image "${ref.path}" is ${Math.round(stat.size / 1024 / 1024)} MB.`,
              {
                file: relPath,
                hint: 'Limit is 5 MB.',
              },
            ),
          );
        } else {
          violations.push(
            info(
              'og-image-ok',
              `og:image "${ref.path}" (${Math.round(stat.size / 1024)} KB) is valid.`,
            ),
          );
        }
      } catch {
        // File stat failed; already flagged above.
      }
    }
  }

  return violations;
}
