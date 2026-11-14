/**
 * Security test: memory exhaustion prevention. Verifies that
 * processing loops and array allocations are bounded.
 */

import { describe, it, expect } from 'vitest';
import { validateBatch } from '../../src/platform/security/file-policy';
import { MAX_PIXEL_COUNT } from '../../src/tools/image-compressor/engine/validation';

function makeFile(name: string, type: string, size: number): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe('security: memory exhaustion prevention', () => {
  it('rejects batch with too many files', () => {
    const files = Array.from({ length: 60 }, (_, i) =>
      makeFile(`photo-${i}.png`, 'image/png', 100),
    );
    const result = validateBatch(files, 'image');
    expect(result.ok).toBe(false);
    expect(result.violations.map((v) => v.code)).toContain('batch-too-large');
  });

  it('accepts batch within limits', () => {
    const files = Array.from({ length: 5 }, (_, i) => makeFile(`photo-${i}.png`, 'image/png', 100));
    const result = validateBatch(files, 'image');
    expect(result.ok).toBe(true);
  });

  it('pixel count limit is bounded', () => {
    expect(MAX_PIXEL_COUNT).toBeLessThanOrEqual(100_000_000);
    expect(MAX_PIXEL_COUNT).toBeGreaterThan(0);
  });

  it('does not allocate unbounded arrays on bad input', () => {
    // The validator returns violations, not array of arbitrary size
    const files = Array.from({ length: 100 }, () => makeFile('photo.png', 'image/png', 100));
    const result = validateBatch(files, 'image');
    // Violations should be small and bounded
    expect(result.violations.length).toBeLessThan(files.length * 2);
  });
});
