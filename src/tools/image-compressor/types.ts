/**
 * Image compressor types. Shared between UI, engine and worker.
 */

/** Supported input MIME types. */
export type SupportedMime = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif' | 'image/avif';

/** Supported output formats. */
export type OutputFormat = 'jpeg' | 'webp' | 'png';

/** Compression preset that maps to specific quality/format settings. */
export type CompressionPreset = 'balanced' | 'smaller' | 'higher-quality';

export interface CompressionOptions {
  /** Target output format. Defaults to input format when possible. */
  format: OutputFormat;
  /** Quality for lossy formats (jpeg, webp), 0.1-1.0. Ignored for png. */
  quality: number;
  /** If true, the engine also resizes to reduce bytes. */
  resizeToMaxDimension: number | null;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface CompressionInput {
  /** Raw bytes of the source image. */
  bytes: ArrayBuffer;
  /** Original MIME type from the File object. */
  inputMime: SupportedMime;
  /** Original file name (for output naming only). */
  fileName: string;
  /** Compression options. */
  options: CompressionOptions;
}

export interface CompressionResult {
  /** Compressed bytes. */
  bytes: ArrayBuffer;
  /** Output MIME type matching the chosen format. */
  outputMime: SupportedMime;
  /** Original size in bytes. */
  inputSize: number;
  /** Compressed size in bytes. */
  outputSize: number;
  /** Original dimensions. */
  originalDimensions: ImageDimensions;
  /** Output dimensions (may differ if resized). */
  outputDimensions: ImageDimensions;
  /** Wall-clock duration in milliseconds. */
  durationMs: number;
}

export type WorkerRequest =
  { kind: 'compress'; id: number; input: CompressionInput } | { kind: 'cancel'; id: number };

export type WorkerResponse =
  | { kind: 'result'; id: number; result: CompressionResult }
  | { kind: 'error'; id: number; message: string; code: WorkerErrorCode };

export type WorkerErrorCode =
  | 'decode-failed'
  | 'encode-failed'
  | 'canvas-unavailable'
  | 'unsupported-format'
  | 'cancelled'
  | 'internal';

export function presetToOptions(preset: CompressionPreset, inputSize: number): CompressionOptions {
  // Small files keep their format and quality to avoid visual loss.
  if (inputSize < 200 * 1024) {
    return {
      format: 'webp',
      quality: 0.85,
      resizeToMaxDimension: null,
    };
  }

  switch (preset) {
    case 'smaller':
      return {
        format: 'webp',
        quality: 0.6,
        resizeToMaxDimension: 1920,
      };
    case 'higher-quality':
      return {
        format: 'jpeg',
        quality: 0.9,
        resizeToMaxDimension: 4096,
      };
    case 'balanced':
    default:
      return {
        format: 'webp',
        quality: 0.75,
        resizeToMaxDimension: 2560,
      };
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function savingsPercent(inputSize: number, outputSize: number): number {
  if (inputSize <= 0) return 0;
  const saved = Math.max(0, inputSize - outputSize);
  return Math.round((saved / inputSize) * 100);
}
