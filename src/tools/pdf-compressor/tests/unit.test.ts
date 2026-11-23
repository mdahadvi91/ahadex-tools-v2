import { describe, expect, it } from 'vitest';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { compressPdfBuffer, validatePdfBuffer } from '../engine';
import { pdfSavingsPercent } from '../types';

async function buildSamplePdf(withMetadata = true): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  if (withMetadata) {
    doc.setTitle('Sample Confidential Report With Long Metadata Title');
    doc.setAuthor('Sample Author Name');
    doc.setSubject('Quarterly Technical Analysis Subject');
    doc.setKeywords(['report', 'analysis', 'sample', 'metadata']);
    doc.setCreator('Test Suite Creator');
    doc.setProducer('Test Suite Producer');
  }
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([600, 800]);
  page.drawText('AHADEX Tools PDF Compressor Engine Verification Page', {
    x: 50,
    y: 720,
    size: 16,
    font,
  });
  return doc.save({ useObjectStreams: false });
}

describe('pdf-compressor unit engine', () => {
  it('validates empty or non-PDF buffers cleanly', () => {
    expect(validatePdfBuffer(new ArrayBuffer(0), 'empty.pdf').valid).toBe(false);
    const badBytes = new TextEncoder().encode('NOT_A_PDF_FILE').buffer;
    expect(validatePdfBuffer(badBytes, 'bad.pdf').valid).toBe(false);
  });

  it('optimizes a PDF buffer, preserves page count, and strips metadata when requested', async () => {
    const raw = await buildSamplePdf(true);
    const inputBuf = raw.slice().buffer;

    const result = await compressPdfBuffer({
      bytes: inputBuf,
      fileName: 'sample.pdf',
      options: {
        useObjectStreams: true,
        stripMetadata: true,
      },
    });

    expect(result.pageCount).toBe(1);
    expect(result.outputSize).toBeGreaterThan(0);
    expect(result.usedObjectStreams).toBe(true);
    expect(result.metadataStripped).toBe(true);

    const reloaded = await PDFDocument.load(result.bytes);
    expect(reloaded.getPageCount()).toBe(1);
    expect(reloaded.getTitle() ?? '').toBe('');
    expect(reloaded.getAuthor() ?? '').toBe('');
  });

  it('calculates savings percentage accurately', () => {
    expect(pdfSavingsPercent(1000, 750)).toBe(25);
    expect(pdfSavingsPercent(0, 100)).toBe(0);
    expect(pdfSavingsPercent(1000, 1100)).toBe(-10);
  });
});
