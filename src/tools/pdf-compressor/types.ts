/**
 * PDF Compressor types shared between the browser engine, validation, and UI.
 */

export interface PdfCompressionOptions {
  /** Re-encode PDF cross-reference and object streams for smaller structure. */
  useObjectStreams: boolean;
  /** Remove optional document info fields (Title, Author, Producer, Creator, Keywords). */
  stripMetadata: boolean;
}

export interface PdfCompressionInput {
  bytes: ArrayBuffer;
  fileName: string;
  options: PdfCompressionOptions;
}

export interface PdfCompressionResult {
  bytes: Uint8Array;
  inputSize: number;
  outputSize: number;
  pageCount: number;
  usedObjectStreams: boolean;
  metadataStripped: boolean;
  durationMs: number;
}

export function pdfSavingsPercent(inputSize: number, outputSize: number): number {
  if (inputSize <= 0) return 0;
  return Math.round(((inputSize - outputSize) / inputSize) * 100);
}
