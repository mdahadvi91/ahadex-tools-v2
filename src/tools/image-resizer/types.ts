/**
 * Image Resizer types. Shared between UI, engine and worker.
 */

export type SupportedMime =
  | 'image/png'
  | 'image/jpeg'
  | 'image/webp'
  | 'image/gif'
  | 'image/avif';

export type OutputFormat = 'jpeg' | 'webp' | 'png';

export type ResizeMode = 'dimensions' | 'percentage' | 'preset';

export interface ResizeOptions {
  /** Output format. Defaults to input format when possible. */
  format: OutputFormat;
  /** Quality for lossy formats (jpeg, webp), 0.1-1.0. */
  quality: number;
  /** Target width in pixels. null = auto from height. */
  width: number | null;
  /** Target height in pixels. null = auto from width. */
  height: number | null;
  /** If true, maintains aspect ratio when one dimension is null. */
  maintainAspectRatio: boolean;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ResizeInput {
  bytes: ArrayBuffer;
  inputMime: SupportedMime;
  fileName: string;
  options: ResizeOptions;
}

export interface ResizeResult {
  bytes: ArrayBuffer;
  outputMime: SupportedMime;
  inputSize: number;
  outputSize: number;
  originalDimensions: ImageDimensions;
  outputDimensions: ImageDimensions;
  durationMs: number;
}

export const PRESETS = [
  { label: 'Thumbnail', width: 150, height: 150 },
  { label: 'Small', width: 480, height: 480 },
  { label: 'Medium', width: 800, height: 800 },
  { label: 'Large', width: 1920, height: 1920 },
  { label: 'Instagram Square', width: 1080, height: 1080 },
  { label: 'Instagram Portrait', width: 1080, height: 1350 },
  { label: 'Instagram Story', width: 1080, height: 1920 },
  { label: 'Facebook Cover', width: 820, height: 312 },
  { label: 'Twitter Post', width: 1200, height: 675 },
  { label: 'YouTube Thumbnail', width: 1280, height: 720 },
] as const;

export function computeOutputDimensions(
  original: ImageDimensions,
  options: ResizeOptions,
): ImageDimensions {
  const targetW = options.width ?? null;
  const targetH = options.height ?? null;

  if (targetW === null && targetH === null) {
    return { ...original };
  }

  if (targetW !== null && targetH !== null) {
    return { width: targetW, height: targetH };
  }

  const aspect = original.width / original.height;

  if (targetW !== null) {
    return { width: targetW, height: Math.max(1, Math.round(targetW / aspect)) };
  }

  // targetH !== null
  return { width: Math.max(1, Math.round((targetH as number) * aspect)), height: targetH as number };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function dimensionsChanged(
  original: ImageDimensions,
  output: ImageDimensions,
): boolean {
  return original.width !== output.width || original.height !== output.height;
}

export type WorkerErrorCode =
  | 'decode-failed'
  | 'encode-failed'
  | 'canvas-unavailable'
  | 'unsupported-format'
  | 'invalid-dimensions'
  | 'internal';
