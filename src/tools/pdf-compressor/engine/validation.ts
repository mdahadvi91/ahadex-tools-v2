/**
 * Validation helpers for PDF Compressor inputs.
 */

export const MAX_PDF_BYTES = 50 * 1024 * 1024;
export const PDF_HEADER_SIGNATURE = '%PDF-';

export interface PdfValidationResult {
  valid: boolean;
  reason?: string;
}

export function validatePdfBuffer(
  bytes: ArrayBuffer,
  fileName = 'document.pdf',
): PdfValidationResult {
  if (!bytes || bytes.byteLength === 0) {
    return { valid: false, reason: `${fileName} is empty.` };
  }
  if (bytes.byteLength > MAX_PDF_BYTES) {
    return { valid: false, reason: `${fileName} exceeds the 50 MB size limit.` };
  }

  const headerSlice = new Uint8Array(bytes.slice(0, 1024));
  const headerText = new TextDecoder('ascii', { fatal: false }).decode(headerSlice);
  if (!headerText.includes(PDF_HEADER_SIGNATURE)) {
    return { valid: false, reason: `${fileName} does not appear to be a valid PDF header.` };
  }

  return { valid: true };
}
