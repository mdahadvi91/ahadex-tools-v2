/**
 * File-related helpers: extension parsing, filename sanitization,
 * MIME type checks.
 */

const IMAGE_MIME = /^image\/(png|jpe?g|webp|gif|avif|svg\+xml)$/i;
const PDF_MIME = /^application\/pdf$/i;
const PDF_EXT = /\.pdf$/i;
const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif|svg)$/i;

/**
 * Returns the lowercase extension without the dot, or "" if none.
 * "photo.JPG" -> "jpg", "archive.tar.gz" -> "gz", "noext" -> ""
 */
export function getFileExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot <= 0 || dot === filename.length - 1) return '';
  return filename.slice(dot + 1).toLowerCase();
}

/**
 * Returns the filename without its extension.
 * "photo.JPG" -> "photo", "archive.tar.gz" -> "archive.tar"
 */
export function getFileBaseName(filename: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot <= 0) return filename;
  return filename.slice(0, dot);
}

/**
 * Strips path separators and control characters to prevent traversal
 * and filesystem issues. Preserves spaces, dots, dashes, underscores.
 * Returns "file" if result would be empty.
 */
export function sanitizeFilename(filename: string): string {
  const cleaned = filename
    .replace(/[/\\]/g, '_')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/^\.+/, '')
    .trim();
  return cleaned === '' ? 'file' : cleaned;
}

export function isImageFile(file: File): boolean {
  return IMAGE_MIME.test(file.type) || IMAGE_EXT.test(file.name);
}

export function isPdfFile(file: File): boolean {
  return PDF_MIME.test(file.type) || PDF_EXT.test(file.name);
}
