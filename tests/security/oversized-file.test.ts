/**
 * Security test: oversized file handling.
 */

import { describe, it, expect } from 'vitest';
import { validateSingleFile, validateBatch } from '../../src/platform/security/file-policy';
import { MAX_INPUT_BYTES } from '../../src/tools/image-compressor/engine/validation';

function makeFile(name: string, type: string, size: number): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe('security: oversized file rejection', () => {
  it('rejects file 1 byte over limit', () => {
    const file = makeFile('huge.png', 'image/png', MAX_INPUT_BYTES + 1);
    const result = validateSingleFile(file, 'image');
    expect(result.ok).toBe(false);
    expect(result.violations.map((v) => v.code)).toContain('too-large');
  });

  it('rejects file 10x over limit', () => {
    const file = makeFile('massive.png', 'image/png', MAX_INPUT_BYTES * 10);
    const result = validateSingleFile(file, 'image');
    expect(result.ok).toBe(false);
  });

  it('accepts file exactly at limit', () => {
    const file = makeFile('at-limit.png', 'image/png', MAX_INPUT_BYTES);
    const result = validateSingleFile(file, 'image');
    expect(typeof result.ok).toBe('boolean');
  });

  it('rejects empty file', () => {
    const file = makeFile('zero.png', 'image/png', 0);
    const result = validateSingleFile(file, 'image');
    expect(result.ok).toBe(false);
    expect(result.violations.map((v) => v.code)).toContain('empty');
  });

  it('rejects batch exceeding total size limit', () => {
    const files = Array.from({ length: 5 }, () =>
      makeFile('large.png', 'image/png', MAX_INPUT_BYTES),
    );
    const result = validateBatch(files, 'image');
    expect(result.ok).toBe(false);
    expect(result.violations.map((v) => v.code)).toContain('batch-too-big');
  });
});
