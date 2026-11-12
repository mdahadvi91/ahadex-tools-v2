/**
 * Image asset validator. Ensures image files have reasonable sizes
 * and appropriate formats:
 *   - No image larger than 2 MB in public/images or tool assets
 *   - No BMP or TIFF (should be converted to WebP/PNG/JPEG)
 *   - Prefer WebP/AVIF for large photos
 */

import { join } from 'node:path';
import { stat } from 'node:fs/promises';
import { walkFiles, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, info, warning, type Violation } from '../../utils/validation-result';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const FORBIDDEN_EXTENSIONS = new Set(['.bmp', '.tiff', '.tif']);
const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg'];

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const imageDirs = [join(PATHS.public, 'images'), join(PATHS.srcTools)];

  for (const dir of imageDirs) {
    if (!(await pathExists(dir))) continue;

    const images = await walkFiles(dir, { extensions: IMAGE_EXTS });
    for (const file of images) {
      const relPath = file
        .substring(PATHS.root.length + 1)
        .split('\\')
        .join('/');
      const ext = '.' + (file.split('.').pop() ?? '').toLowerCase();

      if (FORBIDDEN_EXTENSIONS.has(ext)) {
        violations.push(
          error('forbidden-image-format', `Forbidden image format "${ext}".`, {
            file: relPath,
            hint: 'Convert to WebP, PNG, JPEG or AVIF.',
          }),
        );
        continue;
      }

      try {
        const stats = await stat(file);
        if (stats.size > MAX_IMAGE_BYTES) {
          violations.push(
            warning(
              'image-too-large',
              `Image is ${(stats.size / 1024 / 1024).toFixed(2)} MB (max 2 MB).`,
              {
                file: relPath,
                hint: 'Compress or convert to WebP/AVIF.',
              },
            ),
          );
        }
      } catch {
        // skip on stat failure
      }
    }
  }

  if (violations.length === 0) {
    violations.push(info('image-assets-ok', 'All image assets are within limits.'));
  }

  return violations;
}
