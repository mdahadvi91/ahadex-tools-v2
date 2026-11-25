/**
 * Browser-side PDF page splitting and extraction engine built on pdf-lib.
 */

import { PDFDocument } from 'pdf-lib';
import type { SplitPdfChunk, SplitPdfInput, SplitPdfResult } from '../types';
import { parsePageRanges, validatePdfBuffer } from './validation';

function baseFileName(fileName: string): string {
  return fileName.replace(/\.pdf$/i, '') || 'document';
}

export async function inspectPdfPageCount(bytes: ArrayBuffer, fileName: string): Promise<number> {
  const check = validatePdfBuffer(bytes, fileName);
  if (!check.valid) {
    throw new Error(check.reason ?? 'Invalid PDF document.');
  }

  try {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: false });
    return doc.getPageCount();
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.toLowerCase().includes('encrypt')) {
      throw new Error(`${fileName} is encrypted or password-protected.`, { cause: err });
    }
    throw new Error(`Could not inspect ${fileName} as a valid PDF.`, { cause: err });
  }
}

export async function splitPdfBuffer(input: SplitPdfInput): Promise<SplitPdfResult> {
  const start = performance.now();
  const check = validatePdfBuffer(input.bytes, input.fileName);
  if (!check.valid) {
    throw new Error(check.reason ?? 'Invalid PDF input.');
  }

  let srcDoc: PDFDocument;
  try {
    srcDoc = await PDFDocument.load(input.bytes, { ignoreEncryption: false });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.toLowerCase().includes('encrypt')) {
      throw new Error(
        `${input.fileName} is encrypted or password-protected. Unlock it before splitting.`,
        { cause: err },
      );
    }
    throw new Error(`Could not parse ${input.fileName} as a valid PDF.`, { cause: err });
  }

  const totalPages = srcDoc.getPageCount();
  const stem = baseFileName(input.fileName);
  const chunks: SplitPdfChunk[] = [];

  if (input.mode === 'extract-range') {
    const parsed = parsePageRanges(input.pageRangeInput ?? '', totalPages);
    if (!parsed.valid) {
      throw new Error(parsed.reason ?? 'Invalid page range.');
    }

    const outDoc = await PDFDocument.create();
    const copied = await outDoc.copyPages(srcDoc, parsed.indices);
    for (const page of copied) {
      outDoc.addPage(page);
    }
    const bytes = await outDoc.save({ useObjectStreams: true, addDefaultPage: false });
    chunks.push({
      label: `Extracted pages (${parsed.pageNumbers.join(', ')})`,
      outputName: `${stem}-extracted.pdf`,
      pageNumbers: parsed.pageNumbers,
      pageCount: parsed.pageNumbers.length,
      bytes,
      outputSize: bytes.byteLength,
    });
  } else {
    for (let i = 0; i < totalPages; i++) {
      const outDoc = await PDFDocument.create();
      const [copiedPage] = await outDoc.copyPages(srcDoc, [i]);
      outDoc.addPage(copiedPage);
      const bytes = await outDoc.save({ useObjectStreams: true, addDefaultPage: false });
      const pageNum = i + 1;
      chunks.push({
        label: `Page ${pageNum} of ${totalPages}`,
        outputName: `${stem}-page-${pageNum}.pdf`,
        pageNumbers: [pageNum],
        pageCount: 1,
        bytes,
        outputSize: bytes.byteLength,
      });
      if (pageNum % 5 === 0 && pageNum < totalPages) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
  }

  const durationMs = Math.max(1, Math.round(performance.now() - start));
  return {
    sourcePageCount: totalPages,
    chunks,
    durationMs,
  };
}
