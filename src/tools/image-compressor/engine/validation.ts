/**
 * Pre-flight validation for image compression. Runs in the worker
 * before any decoding to fail fast on bad input.
 */

import type { CompressionInput, OutputFormat, SupportedMime } from '../types';

const SUPPORTED_INPUT_MIMES = new Set<SupportedMime>([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/avif',
]);

const SUPPORTED_OUTPUT_FORMATS = new Set<OutputFormat>(['jpeg', 'webp', 'png']);

/** 25 MB hard cap. Matches file-policy.ts. */
export const MAX_INPUT_BYTES = 25 * 1024 * 1024;

/** A sane upper bound to prevent absurd dimensions from decoding. */
export const MAX_PIXEL_COUNT = 80_000_000;

export interface ValidationIssue {
  code:
    | 'unsupported-input-mime'
    | 'unsupported-output-format'
    | 'input-too-large'
    | 'empty-input'
    | 'bad-quality';
  message: string;
}

export function validateInput(input: CompressionInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (input.bytes.byteLength === 0) {
    issues.push({ code: 'empty-input', message: 'File is empty.' });
  }
  if (input.bytes.byteLength > MAX_INPUT_BYTES) {
    issues.push({
      code: 'input-too-large',
      message: `File is ${(input.bytes.byteLength / 1024 / 1024).toFixed(1)} MB, exceeds 25 MB.`,
    });
  }
  if (!SUPPORTED_INPUT_MIMES.has(input.inputMime)) {
    issues.push({
      code: 'unsupported-input-mime',
      message: `Input MIME "${input.inputMime}" is not supported.`,
    });
  }
  if (!SUPPORTED_OUTPUT_FORMATS.has(input.options.format)) {
    issues.push({
      code: 'unsupported-output-format',
      message: `Output format "${input.options.format}" is not supported.`,
    });
  }
  if (input.options.quality < 0.1 || input.options.quality > 1) {
    issues.push({
      code: 'bad-quality',
      message: `Quality must be 0.1-1.0, got ${input.options.quality}.`,
    });
  }

  return issues;
}

export function isMimeSupported(mime: string): mime is SupportedMime {
  return SUPPORTED_INPUT_MIMES.has(mime as SupportedMime);
}
