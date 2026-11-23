import { describe, expect, it } from 'vitest';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { inspectPdfPageCount, parsePageRanges, splitPdfBuffer } from '../engine';

async function makeMultiPagePdf(pages: number): Promise<ArrayBuffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage([400, 500]);
    page.drawText(`Page ${i + 1}`, { x: 40, y: 420, size: 14, font });
  }
  const bytes = await doc.save();
  return bytes.slice().buffer;
}

describe('split-pdf unit engine', () => {
  it('parses valid page ranges and rejects reversed or out-of-bounds ranges', () => {
    const valid = parsePageRanges('1-2, 4, 2', 5);
    expect(valid.valid).toBe(true);
    expect(valid.pageNumbers).toEqual([1, 2, 4]);
    expect(valid.indices).toEqual([0, 1, 3]);

    expect(parsePageRanges('4-2', 5).valid).toBe(false);
    expect(parsePageRanges('1-7', 5).valid).toBe(false);
    expect(parsePageRanges('abc', 5).valid).toBe(false);
  });

  it('extracts custom page ranges and splits every page cleanly', async () => {
    const pdfBuf = await makeMultiPagePdf(4);
    expect(await inspectPdfPageCount(pdfBuf, 'sample.pdf')).toBe(4);

    const extracted = await splitPdfBuffer({
      bytes: pdfBuf,
      fileName: 'sample.pdf',
      mode: 'extract-range',
      pageRangeInput: '2-3',
    });
    expect(extracted.sourcePageCount).toBe(4);
    expect(extracted.chunks.length).toBe(1);
    expect(extracted.chunks[0].pageCount).toBe(2);

    const outDoc = await PDFDocument.load(extracted.chunks[0].bytes);
    expect(outDoc.getPageCount()).toBe(2);

    const splitAll = await splitPdfBuffer({
      bytes: pdfBuf,
      fileName: 'sample.pdf',
      mode: 'every-page',
    });
    expect(splitAll.chunks.length).toBe(4);
    for (const chunk of splitAll.chunks) {
      expect(chunk.pageCount).toBe(1);
      const single = await PDFDocument.load(chunk.bytes);
      expect(single.getPageCount()).toBe(1);
    }
  });
});
