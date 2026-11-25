/**
 * Unit tests for the Image Compressor engine pure helpers.
 * These tests run in Node (no browser APIs needed).
 */

import { afterEach, describe, it, expect, vi } from 'vitest';
import { presetToOptions, formatBytes, savingsPercent } from '../types';
import { ImageCompressorEngine } from '../engine';
import {
  validateInput,
  isMimeSupported,
  MAX_INPUT_BYTES,
  MAX_PIXEL_COUNT,
} from '../engine/validation';

describe('presetToOptions', () => {
  it('keeps quality high for small files', () => {
    const options = presetToOptions('balanced', 100 * 1024);
    expect(options.quality).toBeGreaterThanOrEqual(0.8);
    expect(options.format).toBe('webp');
    expect(options.resizeToMaxDimension).toBeNull();
  });

  it('reduces quality for "smaller" preset on large files', () => {
    const options = presetToOptions('smaller', 5 * 1024 * 1024);
    expect(options.quality).toBeLessThanOrEqual(0.7);
    expect(options.resizeToMaxDimension).toBe(1920);
  });

  it('boosts quality for "higher-quality" preset', () => {
    const options = presetToOptions('higher-quality', 5 * 1024 * 1024);
    expect(options.quality).toBeGreaterThanOrEqual(0.85);
    expect(options.resizeToMaxDimension).toBe(4096);
  });
});

describe('formatBytes', () => {
  it('formats bytes under 1 KB', () => {
    expect(formatBytes(512)).toBe('512 B');
  });
  it('formats KB', () => {
    expect(formatBytes(2048)).toBe('2.0 KB');
  });
  it('formats MB', () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.00 MB');
  });
  it('handles zero', () => {
    expect(formatBytes(0)).toBe('0 B');
  });
});

describe('savingsPercent', () => {
  it('returns 0 for equal sizes', () => {
    expect(savingsPercent(1000, 1000)).toBe(0);
  });
  it('returns 50 for half size', () => {
    expect(savingsPercent(1000, 500)).toBe(50);
  });
  it('returns 0 when output is larger than input (no negative savings)', () => {
    expect(savingsPercent(1000, 1500)).toBe(0);
  });
  it('handles zero input', () => {
    expect(savingsPercent(0, 100)).toBe(0);
  });
});

describe('validateInput', () => {
  const baseInput = {
    bytes: new ArrayBuffer(1024),
    inputMime: 'image/png' as const,
    fileName: 'test.png',
    options: { format: 'webp' as const, quality: 0.8, resizeToMaxDimension: null },
  };

  it('accepts valid input', () => {
    expect(validateInput(baseInput)).toEqual([]);
  });

  it('rejects empty input', () => {
    const issues = validateInput({ ...baseInput, bytes: new ArrayBuffer(0) });
    expect(issues.map((i) => i.code)).toContain('empty-input');
  });

  it('rejects oversized input', () => {
    const issues = validateInput({
      ...baseInput,
      bytes: new ArrayBuffer(MAX_INPUT_BYTES + 1),
    });
    expect(issues.map((i) => i.code)).toContain('input-too-large');
  });

  it('rejects unsupported MIME', () => {
    const issues = validateInput({ ...baseInput, inputMime: 'image/bmp' as never });
    expect(issues.map((i) => i.code)).toContain('unsupported-input-mime');
  });

  it('rejects unsupported output format', () => {
    const issues = validateInput({
      ...baseInput,
      options: { ...baseInput.options, format: 'gif' as never },
    });
    expect(issues.map((i) => i.code)).toContain('unsupported-output-format');
  });

  it('rejects bad quality', () => {
    const issues = validateInput({
      ...baseInput,
      options: { ...baseInput.options, quality: 0.05 },
    });
    expect(issues.map((i) => i.code)).toContain('bad-quality');
  });

  it('rejects quality above 1', () => {
    const issues = validateInput({
      ...baseInput,
      options: { ...baseInput.options, quality: 1.5 },
    });
    expect(issues.map((i) => i.code)).toContain('bad-quality');
  });
});

describe('isMimeSupported', () => {
  it('recognizes supported MIME types', () => {
    expect(isMimeSupported('image/png')).toBe(true);
    expect(isMimeSupported('image/jpeg')).toBe(true);
    expect(isMimeSupported('image/webp')).toBe(true);
    expect(isMimeSupported('image/gif')).toBe(true);
    expect(isMimeSupported('image/avif')).toBe(true);
  });

  it('rejects unsupported MIME types', () => {
    expect(isMimeSupported('image/bmp')).toBe(false);
    expect(isMimeSupported('application/pdf')).toBe(false);
    expect(isMimeSupported('')).toBe(false);
  });
});

describe('MAX_PIXEL_COUNT', () => {
  it('is capped at 25 megapixels to keep RGBA memory conservative', () => {
    expect(MAX_PIXEL_COUNT).toBe(25_000_000);
  });
});

describe('ImageCompressorEngine worker lifecycle', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('cleans up message, error, and messageerror listeners when ping times out', async () => {
    vi.useFakeTimers();
    const target = new EventTarget();
    const removeSpy = vi.spyOn(target, 'removeEventListener');
    const mockWorker = Object.assign(target, {
      postMessage: vi.fn(),
      terminate: vi.fn(),
      onerror: null,
      onmessage: null,
      onmessageerror: null,
    }) as unknown as Worker;

    const engine = new ImageCompressorEngine(mockWorker);
    const pingPromise = engine.ping(50);

    await vi.advanceTimersByTimeAsync(50);
    await expect(pingPromise).resolves.toBe(false);

    const removedEvents = removeSpy.mock.calls.map(([type]) => type);
    expect(removedEvents).toContain('message');
    expect(removedEvents).toContain('error');
    expect(removedEvents).toContain('messageerror');

    engine.dispose();
  });

  it('rejects pending compress jobs immediately when worker emits messageerror', async () => {
    const target = new EventTarget();
    const mockWorker = Object.assign(target, {
      postMessage: vi.fn(),
      terminate: vi.fn(),
      onerror: null,
      onmessage: null,
      onmessageerror: null,
    }) as unknown as Worker;

    const engine = new ImageCompressorEngine(mockWorker);
    const pendingJob = engine.compress({
      bytes: new ArrayBuffer(8),
      inputMime: 'image/png',
      fileName: 'sample.png',
      options: { format: 'webp', quality: 0.8, resizeToMaxDimension: null },
    });

    target.dispatchEvent(new Event('messageerror'));
    await expect(pendingJob).rejects.toThrow(/messageerror/i);
    engine.dispose();
  });
});
