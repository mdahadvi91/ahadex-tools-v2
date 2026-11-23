/**
 * Browser-side PDF merging engine built on pdf-lib.
 */

import { PDFDocument } from 'pdf-lib';
import type { MergePdfResult, MergeSourceInput } from '../types';
import { validateMergeInputs } from './validation';

export async function mergePdfBuffers(
  sources: readonly MergeSourceInput[],
): Promise<MergePdfResult> {
  const start = performance.now();
  const validation = validateMergeInputs(sources);
  if (!validation.valid) {
    throw new Error(validation.reason ?? 'Invalid PDF merge inputs.');
  }

  const mergedPdf = await PDFDocument.create();
  let totalPages = 0;
  let inputTotalBytes = 0;

  for (const source of sources) {
    inputTotalBytes += source.bytes.byteLength;
    let srcDoc: PDFDocument;
    try {
      srcDoc = await PDFDocument.load(source.bytes, { ignoreEncryption: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('encrypt')) {
        throw new Error(
          `${source.fileName} is encrypted or password-protected. Unlock it before merging.`,
          { cause: err },
        );
      }
      throw new Error(`Could not parse ${source.fileName} as a readable PDF.`, { cause: err });
    }

    const pageIndices = srcDoc.getPageIndices();
    const copiedPages = await mergedPdf.copyPages(srcDoc, pageIndices);
    for (const page of copiedPages) {
      mergedPdf.addPage(page);
    }
    totalPages += copiedPages.length;
  }

  const bytes = await mergedPdf.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: 50,
  });

  const durationMs = Math.max(1, Math.round(performance.now() - start));

  return {
    bytes,
    sourceCount: sources.length,
    totalPages,
    inputTotalBytes,
    outputSize: bytes.byteLength,
    durationMs,
  };
}
