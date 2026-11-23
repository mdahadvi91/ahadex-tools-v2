/**
 * Validation helpers for Merge PDF source lists.
 */

export const MIN_MERGE_FILES = 2;
export const MAX_MERGE_FILES = 20;
export const MAX_PDF_BYTES = 50 * 1024 * 1024;
export const MAX_BATCH_BYTES = 200 * 1024 * 1024;
const PDF_HEADER = '%PDF-';

export interface MergeValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateMergeInputs(
  inputs: readonly { fileName: string; bytes: ArrayBuffer }[],
): MergeValidationResult {
  if (inputs.length < MIN_MERGE_FILES) {
    return { valid: false, reason: 'Select at least 2 PDF files to merge.' };
  }
  if (inputs.length > MAX_MERGE_FILES) {
    return { valid: false, reason: `You can merge up to ${MAX_MERGE_FILES} PDF files at once.` };
  }

  let totalBytes = 0;
  const decoder = new TextDecoder('ascii', { fatal: false });

  for (const item of inputs) {
    if (!item.bytes || item.bytes.byteLength === 0) {
      return { valid: false, reason: `${item.fileName} is empty.` };
    }
    if (item.bytes.byteLength > MAX_PDF_BYTES) {
      return { valid: false, reason: `${item.fileName} exceeds the 50 MB per-file limit.` };
    }
    const header = decoder.decode(new Uint8Array(item.bytes.slice(0, 1024)));
    if (!header.includes(PDF_HEADER)) {
      return { valid: false, reason: `${item.fileName} is not a valid PDF document.` };
    }
    totalBytes += item.bytes.byteLength;
  }

  if (totalBytes > MAX_BATCH_BYTES) {
    return { valid: false, reason: 'Total selected batch size exceeds the 200 MB limit.' };
  }

  return { valid: true };
}
