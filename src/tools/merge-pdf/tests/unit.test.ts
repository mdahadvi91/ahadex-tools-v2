import { describe, expect, it } from 'vitest';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { mergePdfBuffers, validateMergeInputs } from '../engine';

async function makePdf(label: string, pageCount: number): Promise<ArrayBuffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([400, 500]);
    page.drawText(`${label} page ${i + 1}`, { x: 40, y: 420, size: 14, font });
  }
  const bytes = await doc.save();
  return bytes.slice().buffer;
}

describe('merge-pdf unit engine', () => {
  it('rejects fewer than 2 PDF files', async () => {
    const single = await makePdf('DocA', 1);
    const check = validateMergeInputs([{ fileName: 'a.pdf', bytes: single }]);
    expect(check.valid).toBe(false);
  });

  it('merges multiple PDFs sequentially and preserves combined page count', async () => {
    const first = await makePdf('First', 2);
    const second = await makePdf('Second', 3);

    const result = await mergePdfBuffers([
      { fileName: 'first.pdf', bytes: first },
      { fileName: 'second.pdf', bytes: second },
    ]);

    expect(result.sourceCount).toBe(2);
    expect(result.totalPages).toBe(5);
    expect(result.outputSize).toBeGreaterThan(0);

    const parsed = await PDFDocument.load(result.bytes);
    expect(parsed.getPageCount()).toBe(5);
  });
});
