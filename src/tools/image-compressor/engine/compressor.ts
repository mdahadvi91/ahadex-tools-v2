/**
 * Pure compression logic. Runs inside the Web Worker (has access to
 * OffscreenCanvas in modern browsers; falls back to HTMLCanvasElement
 * on older ones).
 *
 * No network calls, no storage, no DOM except canvas APIs.
 */

import type {
  CompressionInput,
  CompressionResult,
  ImageDimensions,
  OutputFormat,
  SupportedMime,
} from '../types';
import { MAX_PIXEL_COUNT, validateInput } from './validation';

type CompressionErrorCode =
  'decode-failed' | 'encode-failed' | 'canvas-unavailable' | 'unsupported-format' | 'internal';

class CompressionError extends Error {
  readonly code: CompressionErrorCode;

  constructor(message: string, code: CompressionErrorCode) {
    super(message);
    this.name = 'CompressionError';
    this.code = code;
  }
}

interface DecodedImage {
  bitmap: ImageBitmap;
  original: ImageDimensions;
}

interface CanvasContext {
  canvas: OffscreenCanvas | HTMLCanvasElement;
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
}

const OUTPUT_MIME: Record<OutputFormat, SupportedMime> = {
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  png: 'image/png',
};

async function decode(bytes: ArrayBuffer, mime: string): Promise<DecodedImage> {
  let blob: Blob;
  try {
    blob = new Blob([bytes], { type: mime });
  } catch (err) {
    throw new CompressionError(
      `Could not wrap bytes as Blob: ${err instanceof Error ? err.message : String(err)}`,
      'internal',
    );
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch (err) {
    throw new CompressionError(
      `Could not decode image: ${err instanceof Error ? err.message : String(err)}`,
      'decode-failed',
    );
  }

  const pixels = bitmap.width * bitmap.height;
  if (pixels > MAX_PIXEL_COUNT) {
    bitmap.close();
    throw new CompressionError(
      `Image is ${bitmap.width}x${bitmap.height} (${pixels} pixels), exceeds limit.`,
      'decode-failed',
    );
  }

  return {
    bitmap,
    original: { width: bitmap.width, height: bitmap.height },
  };
}

function makeCanvas(width: number, height: number): CanvasContext {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new CompressionError('OffscreenCanvas 2d context unavailable.', 'canvas-unavailable');
    }
    return { canvas, ctx };
  }

  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new CompressionError('Canvas 2d context unavailable.', 'canvas-unavailable');
    }
    return { canvas, ctx };
  }

  throw new CompressionError(
    'No canvas implementation available in this environment.',
    'canvas-unavailable',
  );
}

function computeOutputDimensions(
  original: ImageDimensions,
  maxDimension: number | null,
): ImageDimensions {
  if (maxDimension === null) return original;
  const largest = Math.max(original.width, original.height);
  if (largest <= maxDimension) return original;
  const scale = maxDimension / largest;
  return {
    width: Math.max(1, Math.round(original.width * scale)),
    height: Math.max(1, Math.round(original.height * scale)),
  };
}

async function encode(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  mime: SupportedMime,
  quality: number,
): Promise<ArrayBuffer> {
  if (canvas instanceof OffscreenCanvas) {
    const blob = await canvas.convertToBlob({ type: mime, quality });
    return blob.arrayBuffer();
  }

  // HTMLCanvasElement fallback.
  const blob: Blob | null = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), mime, quality);
  });
  if (!blob) {
    throw new CompressionError(`Could not encode as ${mime}.`, 'encode-failed');
  }
  return blob.arrayBuffer();
}

export async function compressImage(input: CompressionInput): Promise<CompressionResult> {
  const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const issues = validateInput(input);
  if (issues.length > 0) {
    const first = issues[0];
    const code: 'unsupported-format' | 'internal' =
      first.code === 'unsupported-input-mime' || first.code === 'unsupported-output-format'
        ? 'unsupported-format'
        : 'internal';
    throw new CompressionError(first.message, code);
  }

  const decoded = await decode(input.bytes, input.inputMime);
  const outputDims = computeOutputDimensions(decoded.original, input.options.resizeToMaxDimension);

  if (outputDims.width * outputDims.height > MAX_PIXEL_COUNT) {
    decoded.bitmap.close();
    throw new CompressionError(
      `Output ${outputDims.width}x${outputDims.height} exceeds 25 MP memory budget.`,
      'decode-failed',
    );
  }

  const canvasInfo = makeCanvas(outputDims.width, outputDims.height);
  const outputMime = OUTPUT_MIME[input.options.format];
  let bytes: ArrayBuffer;
  try {
    try {
      canvasInfo.ctx.drawImage(decoded.bitmap, 0, 0, outputDims.width, outputDims.height);
    } catch (err) {
      throw new CompressionError(
        `drawImage failed: ${err instanceof Error ? err.message : String(err)}`,
        'internal',
      );
    } finally {
      decoded.bitmap.close();
    }

    bytes = await encode(canvasInfo.canvas, outputMime, input.options.quality);
  } finally {
    canvasInfo.canvas.width = 0;
    canvasInfo.canvas.height = 0;
  }

  const durationMs =
    (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt;

  return {
    bytes,
    outputMime,
    inputSize: input.bytes.byteLength,
    outputSize: bytes.byteLength,
    originalDimensions: decoded.original,
    outputDimensions: outputDims,
    durationMs,
  };
}
