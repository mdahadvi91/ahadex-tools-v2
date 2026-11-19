/**
 * Unit tests for the Image Resizer engine pure helpers.
 */

import { describe, it, expect } from 'vitest';
import { computeOutputDimensions, formatBytes, dimensionsChanged, PRESETS } from '../types';
import {
  validateInput,
  isMimeSupported,
  MAX_INPUT_BYTES,
  MAX_DIMENSION,
  MAX_PIXEL_COUNT,
} from '../engine/validation';

describe('computeOutputDimensions', () => {
  const original = { width: 1920, height: 1080 };

  it('returns original when both dimensions null', () => {
    expect(
      computeOutputDimensions(original, {
        format: 'webp',
        quality: 0.8,
        width: null,
        height: null,
        maintainAspectRatio: true,
      }),
    ).toEqual({ width: 1920, height: 1080 });
  });

  it('computes height from width keeping aspect', () => {
    expect(
      computeOutputDimensions(original, {
        format: 'webp',
        quality: 0.8,
        width: 960,
        height: null,
        maintainAspectRatio: true,
      }),
    ).toEqual({ width: 960, height: 540 });
  });

  it('computes width from height keeping aspect', () => {
    expect(
      computeOutputDimensions(original, {
        format: 'webp',
        quality: 0.8,
        width: null,
        height: 540,
        maintainAspectRatio: true,
      }),
    ).toEqual({ width: 960, height: 540 });
  });

  it('uses both dimensions when provided', () => {
    expect(
      computeOutputDimensions(original, {
        format: 'webp',
        quality: 0.8,
        width: 800,
        height: 600,
        maintainAspectRatio: false,
      }),
    ).toEqual({ width: 800, height: 600 });
  });

  it('handles portrait orientation', () => {
    const portrait = { width: 1080, height: 1920 };
    expect(
      computeOutputDimensions(portrait, {
        format: 'webp',
        quality: 0.8,
        width: 540,
        height: null,
        maintainAspectRatio: true,
      }),
    ).toEqual({ width: 540, height: 960 });
  });
});

describe('formatBytes', () => {
  it('formats under 1 KB', () => {
    expect(formatBytes(512)).toBe('512 B');
  });
  it('formats KB', () => {
    expect(formatBytes(2048)).toBe('2.0 KB');
  });
  it('formats MB', () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.00 MB');
  });
});

describe('dimensionsChanged', () => {
  it('returns false when equal', () => {
    expect(dimensionsChanged({ width: 100, height: 100 }, { width: 100, height: 100 })).toBe(false);
  });
  it('returns true when width changes', () => {
    expect(dimensionsChanged({ width: 100, height: 100 }, { width: 200, height: 100 })).toBe(true);
  });
  it('returns true when height changes', () => {
    expect(dimensionsChanged({ width: 100, height: 100 }, { width: 100, height: 200 })).toBe(true);
  });
});

describe('PRESETS', () => {
  it('contains expected social media presets', () => {
    const labels = PRESETS.map((p) => p.label);
    expect(labels).toContain('Instagram Square');
    expect(labels).toContain('Twitter Post');
    expect(labels).toContain('YouTube Thumbnail');
  });

  it('all presets have positive dimensions', () => {
    for (const p of PRESETS) {
      expect(p.width).toBeGreaterThan(0);
      expect(p.height).toBeGreaterThan(0);
    }
  });
});

describe('validateInput', () => {
  const base = {
    bytes: new ArrayBuffer(1024),
    inputMime: 'image/png' as const,
    fileName: 'test.png',
    options: {
      format: 'webp' as const,
      quality: 0.8,
      width: 800,
      height: null,
      maintainAspectRatio: true,
    },
  };

  it('accepts valid input', () => {
    expect(validateInput(base)).toEqual([]);
  });

  it('rejects empty bytes', () => {
    const issues = validateInput({ ...base, bytes: new ArrayBuffer(0) });
    expect(issues.map((i) => i.code)).toContain('empty-input');
  });

  it('rejects oversized bytes', () => {
    const issues = validateInput({ ...base, bytes: new ArrayBuffer(MAX_INPUT_BYTES + 1) });
    expect(issues.map((i) => i.code)).toContain('input-too-large');
  });

  it('rejects invalid width', () => {
    const issues = validateInput({
      ...base,
      options: { ...base.options, width: MAX_DIMENSION + 1 },
    });
    expect(issues.map((i) => i.code)).toContain('invalid-dimensions');
  });

  it('rejects both dimensions null', () => {
    const issues = validateInput({
      ...base,
      options: { ...base.options, width: null, height: null },
    });
    expect(issues.map((i) => i.code)).toContain('invalid-dimensions');
  });

  it('rejects bad quality', () => {
    const issues = validateInput({
      ...base,
      options: { ...base.options, quality: 0.05 },
    });
    expect(issues.map((i) => i.code)).toContain('bad-quality');
  });

  it('rejects unsupported MIME', () => {
    const issues = validateInput({ ...base, inputMime: 'image/bmp' as never });
    expect(issues.map((i) => i.code)).toContain('unsupported-input-mime');
  });
});

describe('isMimeSupported', () => {
  it('accepts PNG, JPEG, WebP, GIF, AVIF', () => {
    expect(isMimeSupported('image/png')).toBe(true);
    expect(isMimeSupported('image/jpeg')).toBe(true);
    expect(isMimeSupported('image/webp')).toBe(true);
    expect(isMimeSupported('image/gif')).toBe(true);
    expect(isMimeSupported('image/avif')).toBe(true);
  });
  it('rejects BMP, PDF', () => {
    expect(isMimeSupported('image/bmp')).toBe(false);
    expect(isMimeSupported('application/pdf')).toBe(false);
  });
});

describe('constants', () => {
  it('MAX_PIXEL_COUNT is 80 megapixels', () => {
    expect(MAX_PIXEL_COUNT).toBe(80_000_000);
  });
});
