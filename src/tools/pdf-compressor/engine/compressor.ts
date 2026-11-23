/**
 * Browser-side PDF optimization engine built on pdf-lib.
 * Re-serializes object structures using object streams and clears
 * optional metadata without transmitting any bytes off the device.
 */

import { PDFDocument } from 'pdf-lib';
import type { PdfCompressionInput, PdfCompressionResult } from '../types';
import { validatePdfBuffer } from './validation';

export async function compressPdfBuffer(input: PdfCompressionInput): Promise<PdfCompressionResult> {
  const start = performance.now();
  const validation = validatePdfBuffer(input.bytes, input.fileName);
  if (!validation.valid) {
    throw new Error(validation.reason ?? 'Invalid PDF input.');
  }

  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(input.bytes, {
      ignoreEncryption: false,
      updateMetadata: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message.toLowerCase().includes('encrypt')) {
      throw new Error(
        `${input.fileName} is encrypted or password-protected. Unlock it before optimizing.`,
        { cause: err },
      );
    }
    throw new Error(`Could not parse ${input.fileName} as a valid PDF document.`, { cause: err });
  }

  if (input.options.stripMetadata) {
    doc.setTitle('');
    doc.setAuthor('');
    doc.setSubject('');
    doc.setKeywords([]);
    doc.setCreator('');
    doc.setProducer('');
  }

  const savedBytes = await doc.save({
    useObjectStreams: input.options.useObjectStreams,
    addDefaultPage: false,
    objectsPerTick: 50,
  });

  const durationMs = Math.max(1, Math.round(performance.now() - start));

  return {
    bytes: savedBytes,
    inputSize: input.bytes.byteLength,
    outputSize: savedBytes.byteLength,
    pageCount: doc.getPageCount(),
    usedObjectStreams: input.options.useObjectStreams,
    metadataStripped: input.options.stripMetadata,
    durationMs,
  };
}
