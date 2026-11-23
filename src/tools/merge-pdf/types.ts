/**
 * Shared types for the Merge PDF tool.
 */

export interface MergeSourceInput {
  fileName: string;
  bytes: ArrayBuffer;
}

export interface MergePdfResult {
  bytes: Uint8Array;
  sourceCount: number;
  totalPages: number;
  inputTotalBytes: number;
  outputSize: number;
  durationMs: number;
}
