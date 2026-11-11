/**
 * Central security configuration: file limits, allowed MIME types,
 * filename constraints.
 */

export interface FileRule {
  readonly maxSizeBytes: number;
  readonly mimeTypes: readonly string[];
  readonly extensions: readonly string[];
}

export const FILE_LIMITS = Object.freeze({
  /** Single image file: 25 MB. */
  image: {
    maxSizeBytes: 25 * 1024 * 1024,
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
    extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif'],
  } satisfies FileRule,
  /** Single PDF file: 100 MB. */
  pdf: {
    maxSizeBytes: 100 * 1024 * 1024,
    mimeTypes: ['application/pdf'],
    extensions: ['pdf'],
  } satisfies FileRule,
  /** Combined input for merge operations: 200 MB. */
  mergeTotalMaxBytes: 200 * 1024 * 1024,
  /** Max number of files in a single batch. */
  maxBatchFiles: 50,
  /** Max filename length in characters. */
  maxFilenameLength: 255,
});

export type FileKind = 'image' | 'pdf';

export function getRule(kind: FileKind): FileRule {
  return FILE_LIMITS[kind];
}
