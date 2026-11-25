/**
 * Security tests for Merge PDF. Verifies file-policy validation, batch bounds,
 * path-traversal filename sanitization, and spoofed PDF payload rejection.
 */

import { describe, expect, it } from 'vitest';
import { validateBatch, validateSingleFile } from '../../../platform/security/file-policy';
import { MAX_MERGE_FILES, MAX_PDF_BYTES, mergePdfBuffers, validateMergeInputs } from '../engine';

function makeFile(name: string, type: string, size: number): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe('merge-pdf security & file policy', () => {
  it('accepts valid PDF files and rejects image/HTML uploads or empty files', () => {
    expect(validateSingleFile(makeFile('part-1.pdf', 'application/pdf', 2048), 'pdf').ok).toBe(
      true,
    );
    expect(validateSingleFile(makeFile('empty.pdf', 'application/pdf', 0), 'pdf').ok).toBe(false);
    expect(validateSingleFile(makeFile('image.jpg', 'image/jpeg', 2048), 'pdf').ok).toBe(false);
    expect(validateSingleFile(makeFile('payload.svg', 'image/svg+xml', 512), 'pdf').ok).toBe(false);
  });

  it('enforces max per-file size and max batch file count', () => {
    const oversized = makeFile('huge.pdf', 'application/pdf', MAX_PDF_BYTES + 1);
    expect(validateSingleFile(oversized, 'pdf').ok).toBe(false);

    const tooMany = Array.from({ length: MAX_MERGE_FILES + 1 }, (_, i) =>
      makeFile(`part-${i}.pdf`, 'application/pdf', 1024),
    );
    expect(validateBatch(tooMany, 'pdf').ok).toBe(false);
  });

  it('rejects spoofed non-PDF headers in merge inputs before pdf-lib parses them', async () => {
    const validHeader = new TextEncoder().encode('%PDF-1.7\n').buffer;
    const spoofed = new TextEncoder().encode('<html>not a pdf</html>').buffer;

    const check = validateMergeInputs([
      { fileName: 'a.pdf', bytes: validHeader },
      { fileName: 'evil.pdf', bytes: spoofed },
    ]);
    expect(check.valid).toBe(false);

    await expect(
      mergePdfBuffers([
        { fileName: 'a.pdf', bytes: validHeader },
        { fileName: 'evil.pdf', bytes: spoofed },
      ]),
    ).rejects.toThrow(/not a valid PDF/i);
  });

  it('handles path traversal characters cleanly in file policy validation', () => {
    const check = validateSingleFile(
      makeFile('..\\..\\secret.pdf', 'application/pdf', 1024),
      'pdf',
    );
    expect(check.ok).toBe(true);
    expect(check.violations).toEqual([]);
  });
});
