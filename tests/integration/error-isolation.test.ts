/**
 * Integration test: error isolation. Verifies that errors in one tool
 * do not break unrelated tools or the app shell.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  normalizeError,
  handleError,
  safeRun,
} from '../../src/platform/observability/error-handler';

describe('error-isolation: normalizeError', () => {
  it('normalizes Error instance', () => {
    const err = new Error('test error');
    const normalized = normalizeError(err);
    expect(normalized.message).toBe('test error');
    expect(normalized.name).toBe('Error');
    expect(normalized.stack).toBeDefined();
  });

  it('normalizes string error', () => {
    const normalized = normalizeError('string error');
    expect(normalized.message).toBe('string error');
    expect(normalized.name).toBe('Error');
  });

  it('handles unknown error', () => {
    const normalized = normalizeError({ weird: 'object' });
    expect(normalized.message).toBe('Unknown error');
    expect(normalized.name).toBe('UnknownError');
  });

  it('handles null', () => {
    const normalized = normalizeError(null);
    expect(normalized.message).toBe('Unknown error');
  });
});

describe('error-isolation: safeRun', () => {
  it('returns result on success', () => {
    const result = safeRun(() => 42);
    expect(result).toBe(42);
  });

  it('returns null on error', () => {
    const loggerSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = safeRun(() => {
      throw new Error('boom');
    });
    expect(result).toBeNull();
    loggerSpy.mockRestore();
  });

  it('does not propagate errors', () => {
    const loggerSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      safeRun(() => {
        throw new Error('boom');
      });
    }).not.toThrow();
    loggerSpy.mockRestore();
  });
});

describe('error-isolation: handleError', () => {
  it('returns normalized error without throwing', () => {
    const loggerSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('test');
    const result = handleError(err);
    expect(result.message).toBe('test');
    expect(result.name).toBe('Error');
    loggerSpy.mockRestore();
  });

  it('accepts context without throwing', () => {
    const loggerSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('test');
    const result = handleError(err, { toolId: 'image-compressor' });
    expect(result.message).toBe('test');
    loggerSpy.mockRestore();
  });
});
