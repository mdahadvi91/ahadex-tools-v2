/**
 * Shared types for the Split PDF tool.
 */

export type SplitMode = 'extract-range' | 'every-page';

export interface SplitPdfInput {
  bytes: ArrayBuffer;
  fileName: string;
  mode: SplitMode;
  pageRangeInput?: string;
}

export interface SplitPdfChunk {
  label: string;
  outputName: string;
  pageNumbers: readonly number[];
  pageCount: number;
  bytes: Uint8Array;
  outputSize: number;
}

export interface SplitPdfResult {
  sourcePageCount: number;
  chunks: readonly SplitPdfChunk[];
  durationMs: number;
}
