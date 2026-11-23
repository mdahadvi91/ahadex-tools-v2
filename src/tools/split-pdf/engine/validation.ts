/**
 * Page-range parsing and PDF buffer validation helpers for Split PDF.
 */

export const MAX_PDF_BYTES = 50 * 1024 * 1024;
const PDF_HEADER = '%PDF-';

export interface RangeParseResult {
  valid: boolean;
  /** Zero-based unique page indices sorted cleanly. */
  indices: number[];
  /** Human-readable 1-based page numbers matching user selection order. */
  pageNumbers: number[];
  reason?: string;
}

export function validatePdfBuffer(
  bytes: ArrayBuffer,
  fileName = 'document.pdf',
): { valid: boolean; reason?: string } {
  if (!bytes || bytes.byteLength === 0) {
    return { valid: false, reason: `${fileName} is empty.` };
  }
  if (bytes.byteLength > MAX_PDF_BYTES) {
    return { valid: false, reason: `${fileName} exceeds the 50 MB size limit.` };
  }
  const header = new TextDecoder('ascii', { fatal: false }).decode(
    new Uint8Array(bytes.slice(0, 1024)),
  );
  if (!header.includes(PDF_HEADER)) {
    return { valid: false, reason: `${fileName} is not a valid PDF file.` };
  }
  return { valid: true };
}

/**
 * Parses a 1-based range string like "1-3, 5, 7-8" against totalPages.
 */
export function parsePageRanges(rawInput: string, totalPages: number): RangeParseResult {
  if (totalPages < 1) {
    return { valid: false, indices: [], pageNumbers: [], reason: 'Document has no pages.' };
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      valid: false,
      indices: [],
      pageNumbers: [],
      reason: `Enter a page number or range between 1 and ${totalPages} (for example: 1-${Math.min(2, totalPages)}).`,
    };
  }

  const tokens = trimmed
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    return { valid: false, indices: [], pageNumbers: [], reason: 'No valid page numbers found.' };
  }

  const seen = new Set<number>();
  const pageNumbers: number[] = [];

  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      const page = Number.parseInt(token, 10);
      if (page < 1 || page > totalPages) {
        return {
          valid: false,
          indices: [],
          pageNumbers: [],
          reason: `Page ${page} is out of range (document has ${totalPages} page${totalPages === 1 ? '' : 's'}).`,
        };
      }
      if (!seen.has(page)) {
        seen.add(page);
        pageNumbers.push(page);
      }
      continue;
    }

    const rangeMatch = /^(\d+)\s*-\s*(\d+)$/.exec(token);
    if (!rangeMatch) {
      return {
        valid: false,
        indices: [],
        pageNumbers: [],
        reason: `Invalid range syntax "${token}". Use numbers or ranges like 1-3, 5.`,
      };
    }

    const start = Number.parseInt(rangeMatch[1], 10);
    const end = Number.parseInt(rangeMatch[2], 10);

    if (start < 1 || end > totalPages || start > end) {
      return {
        valid: false,
        indices: [],
        pageNumbers: [],
        reason: `Range "${token}" is invalid for a ${totalPages}-page PDF.`,
      };
    }

    for (let p = start; p <= end; p++) {
      if (!seen.has(p)) {
        seen.add(p);
        pageNumbers.push(p);
      }
    }
  }

  return {
    valid: true,
    indices: pageNumbers.map((p) => p - 1),
    pageNumbers,
  };
}
