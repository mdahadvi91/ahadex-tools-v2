/**
 * Security tests for Split PDF. Verifies file-policy validation, page-range parser
 * injection/bounds protection, and spoofed PDF header rejection.
 */

import { describe, expect, it } from 'vitest';
import { validateSingleFile } from '../../../platform/security/file-policy';
import {
  inspectPdfPageCount,
  MAX_PDF_BYTES,
  parsePageRanges,
  splitPdfBuffer,
  validatePdfBuffer,
} from '../engine';

function makeFile(name: string, type: string, size: number): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe('split-pdf security & validation', () => {
  it('accepts valid PDF files and rejects non-PDF or oversized files', () => {
    expect(validateSingleFile(makeFile('manual.pdf', 'application/pdf', 2048), 'pdf').ok).toBe(
      true,
    );
    expect(validateSingleFile(makeFile('empty.pdf', 'application/pdf', 0), 'pdf').ok).toBe(false);
    expect(validateSingleFile(makeFile('script.js', 'text/javascript', 512), 'pdf').ok).toBe(false);
    expect(
      validateSingleFile(makeFile('huge.pdf', 'application/pdf', MAX_PDF_BYTES + 1), 'pdf').ok,
    ).toBe(false);
  });

  it('rejects spoofed PDF headers before parsing', async () => {
    const spoofed = new TextEncoder().encode('PK\x03\x04not-a-pdf').buffer;
    expect(validatePdfBuffer(spoofed, 'fake.pdf').valid).toBe(false);

    await expect(inspectPdfPageCount(spoofed, 'fake.pdf')).rejects.toThrow(/not a valid PDF/i);
    await expect(
      splitPdfBuffer({
        bytes: spoofed,
        fileName: 'fake.pdf',
        mode: 'every-page',
      }),
    ).rejects.toThrow(/not a valid PDF/i);
  });

  it('rejects malicious, negative, zero, reversed, and out-of-range page specifications', () => {
    expect(parsePageRanges('0', 10).valid).toBe(false);
    expect(parsePageRanges('-1-3', 10).valid).toBe(false);
    expect(parsePageRanges('1-999999', 10).valid).toBe(false);
    expect(parsePageRanges('8-2', 10).valid).toBe(false);
    expect(parsePageRanges('1;<script>', 10).valid).toBe(false);
    expect(parsePageRanges('   ', 10).valid).toBe(false);
  });
});
