/**
 * Pre-flight validation for image resizing.
 */

import type { OutputFormat, ResizeInput, SupportedMime } from '../types';

const SUPPORTED_INPUT_MIMES = new Set<SupportedMime>([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/avif',
]);

const SUPPORTED_OUTPUT_FORMATS = new Set<OutputFormat>(['jpeg', 'webp', 'png']);

export const MAX_INPUT_BYTES = 25 * 1024 * 1024;
export const MAX_PIXEL_COUNT = 80_000_000;
export const MAX_DIMENSION = 8000;
export const MIN_DIMENSION = 1;

export interface ValidationIssue {
  code:
    | 'unsupported-input-mime'
    | 'unsupported-output-format'
    | 'input-too-large'
    | 'empty-input'
    | 'bad-quality'
    | 'invalid-dimensions';
  message: string;
}

export function validateInput(input: ResizeInput): ValidationIssue[] {
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

  const { width, height } = input.options;
  if (width !== null) {
    if (width < MIN_DIMENSION || width > MAX_DIMENSION) {
      issues.push({
        code: 'invalid-dimensions',
        message: `Width ${width} is outside ${MIN_DIMENSION}-${MAX_DIMENSION}.`,
      });
    }
  }
  if (height !== null) {
    if (height < MIN_DIMENSION || height > MAX_DIMENSION) {
      issues.push({
        code: 'invalid-dimensions',
        message: `Height ${height} is outside ${MIN_DIMENSION}-${MAX_DIMENSION}.`,
      });
    }
  }
  if (width === null && height === null) {
    issues.push({
      code: 'invalid-dimensions',
      message: 'At least one dimension (width or height) must be set.',
    });
  }

  return issues;
}

export function isMimeSupported(mime: string): mime is SupportedMime {
  return SUPPORTED_INPUT_MIMES.has(mime as SupportedMime);
}
