/**
 * Security tests for PDF Compressor. Verifies file-policy validation,
 * PDF magic header enforcement, size/batch limits, and malformed input rejection.
 */

import { describe, expect, it } from 'vitest';
import { validateBatch, validateSingleFile } from '../../../platform/security/file-policy';
import { compressPdfBuffer, MAX_PDF_BYTES, validatePdfBuffer } from '../engine';

function makeFile(name: string, type: string, size: number): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe('pdf-compressor security & file policy', () => {
  it('accepts valid PDF files and rejects non-PDF MIME types or empty files', () => {
    expect(validateSingleFile(makeFile('contract.pdf', 'application/pdf', 2048), 'pdf').ok).toBe(
      true,
    );
    expect(validateSingleFile(makeFile('empty.pdf', 'application/pdf', 0), 'pdf').ok).toBe(false);
    expect(validateSingleFile(makeFile('photo.png', 'image/png', 2048), 'pdf').ok).toBe(false);
    expect(validateSingleFile(makeFile('script.html', 'text/html', 256), 'pdf').ok).toBe(false);
  });

  it('rejects oversized PDFs and batches exceeding file-policy limits', () => {
    const oversized = makeFile('huge.pdf', 'application/pdf', MAX_PDF_BYTES + 1);
    const singleCheck = validateSingleFile(oversized, 'pdf');
    expect(singleCheck.ok).toBe(false);
    expect(singleCheck.violations.map((v) => v.code)).toContain('too-large');

    const tooMany = Array.from({ length: 21 }, (_, i) =>
      makeFile(`doc-${i}.pdf`, 'application/pdf', 1024),
    );
    const batchCheck = validateBatch(tooMany, 'pdf');
    expect(batchCheck.ok).toBe(false);
    expect(batchCheck.violations.map((v) => v.code)).toContain('batch-too-large');
  });

  it('handles path traversal filenames cleanly in file policy validation', () => {
    const traversed = makeFile('../../../etc/passwd.pdf', 'application/pdf', 1024);
    const check = validateSingleFile(traversed, 'pdf');
    expect(check.ok).toBe(true);
    expect(check.violations).toEqual([]);
  });

  it('rejects spoofed .pdf payloads lacking the %PDF- header before parsing', async () => {
    const htmlSpoof = new TextEncoder().encode('<script>alert(1)</script>').buffer;
    expect(validatePdfBuffer(htmlSpoof, 'spoof.pdf').valid).toBe(false);

    await expect(
      compressPdfBuffer({
        bytes: htmlSpoof,
        fileName: 'spoof.pdf',
        options: { useObjectStreams: true, stripMetadata: true },
      }),
    ).rejects.toThrow(/valid PDF header/i);
  });

  it('rejects malformed payloads that pass header check but have corrupt PDF structure', async () => {
    const corrupt = new TextEncoder().encode('%PDF-1.7\ncorrupted body without xref').buffer;
    await expect(
      compressPdfBuffer({
        bytes: corrupt,
        fileName: 'corrupt.pdf',
        options: { useObjectStreams: true, stripMetadata: false },
      }),
    ).rejects.toThrow(/Could not parse/i);
  });
});
