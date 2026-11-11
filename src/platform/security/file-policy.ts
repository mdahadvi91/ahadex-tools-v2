/**
 * Validates files against FILE_LIMITS and produces human-readable
 * violation reasons. Used by every tool before processing.
 */

import { FILE_LIMITS, getRule, type FileKind } from './security-config';
import { getFileExtension, sanitizeFilename } from '../utilities/file-helpers';

export type PolicyViolationCode =
  | 'empty'
  | 'too-large'
  | 'bad-type'
  | 'bad-extension'
  | 'bad-name'
  | 'batch-too-large'
  | 'batch-too-big';

export interface PolicyViolation {
  code: PolicyViolationCode;
  message: string;
}

export interface PolicyResult {
  ok: boolean;
  violations: PolicyViolation[];
}

function violation(code: PolicyViolationCode, message: string): PolicyViolation {
  return { code, message };
}

/**
 * Validates a single file against the rule for its kind.
 */
export function validateSingleFile(file: File, kind: FileKind): PolicyResult {
  const rule = getRule(kind);
  const violations: PolicyViolation[] = [];

  if (file.size === 0) {
    violations.push(violation('empty', `"${file.name}" is empty.`));
  } else if (file.size > rule.maxSizeBytes) {
    violations.push(
      violation(
        'too-large',
        `"${file.name}" exceeds the ${Math.round(rule.maxSizeBytes / 1024 / 1024)} MB limit.`,
      ),
    );
  }

  if (file.type && !rule.mimeTypes.includes(file.type)) {
    violations.push(
      violation('bad-type', `"${file.name}" has unsupported MIME type "${file.type}".`),
    );
  }

  const ext = getFileExtension(file.name);
  if (!rule.extensions.includes(ext)) {
    violations.push(
      violation('bad-extension', `"${file.name}" has unsupported extension ".${ext || '?'}".`),
    );
  }

  const sanitized = sanitizeFilename(file.name);
  if (sanitized.length === 0 || sanitized.length > FILE_LIMITS.maxFilenameLength) {
    violations.push(violation('bad-name', `"${file.name}" has an invalid filename.`));
  }

  return { ok: violations.length === 0, violations };
}

/**
 * Validates a batch of files: per-file rules plus batch count and
 * batch total size.
 */
export function validateBatch(files: readonly File[], kind: FileKind): PolicyResult {
  const violations: PolicyViolation[] = [];

  if (files.length === 0) {
    return {
      ok: false,
      violations: [violation('empty', 'No files provided.')],
    };
  }
  if (files.length > FILE_LIMITS.maxBatchFiles) {
    violations.push(
      violation(
        'batch-too-large',
        `Too many files: ${files.length} > ${FILE_LIMITS.maxBatchFiles}.`,
      ),
    );
  }

  let totalBytes = 0;
  for (const file of files) {
    const single = validateSingleFile(file, kind);
    violations.push(...single.violations);
    totalBytes += file.size;
  }

  const batchMax =
    kind === 'pdf' ? FILE_LIMITS.mergeTotalMaxBytes : FILE_LIMITS.image.maxSizeBytes;
  if (totalBytes > batchMax) {
    violations.push(
      violation(
        'batch-too-big',
        `Total size ${totalBytes} bytes exceeds limit of ${batchMax} bytes.`,
      ),
    );
  }

  return { ok: violations.length === 0, violations };
}
