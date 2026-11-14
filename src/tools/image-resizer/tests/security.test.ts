/**
 * Security tests for Image Resizer.
 */

import { describe, it, expect } from 'vitest';
import { validateSingleFile, validateBatch } from '../../../platform/security/file-policy';
import { MAX_INPUT_BYTES } from '../engine/validation';

function makeFile(name: string, type: string, size: number): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe('image-resizer file policy', () => {
  it('accepts valid PNG', () => {
    expect(validateSingleFile(makeFile('photo.png', 'image/png', 1024), 'image').ok).toBe(true);
  });

  it('accepts valid JPEG', () => {
    expect(validateSingleFile(makeFile('photo.jpg', 'image/jpeg', 1024), 'image').ok).toBe(true);
  });

  it('rejects empty file', () => {
    const r = validateSingleFile(makeFile('empty.png', 'image/png', 0), 'image');
    expect(r.ok).toBe(false);
  });

  it('rejects wrong MIME (PDF)', () => {
    expect(validateSingleFile(makeFile('doc.pdf', 'application/pdf', 1024), 'image').ok).toBe(
      false,
    );
  });

  it('rejects BMP', () => {
    expect(validateSingleFile(makeFile('image.bmp', 'image/bmp', 1024), 'image').ok).toBe(false);
  });

  it('rejects oversized file', () => {
    const r = validateSingleFile(makeFile('huge.png', 'image/png', MAX_INPUT_BYTES + 1), 'image');
    expect(r.ok).toBe(false);
    expect(r.violations.map((v) => v.code)).toContain('too-large');
  });

  it('rejects batch over limit', () => {
    const files = Array.from({ length: 60 }, (_, i) =>
      makeFile(`photo-${i}.png`, 'image/png', 100),
    );
    expect(validateBatch(files, 'image').ok).toBe(false);
  });

  it('accepts batch of 5 small images', () => {
    const files = Array.from({ length: 5 }, (_, i) =>
      makeFile(`photo-${i}.jpg`, 'image/jpeg', 1024),
    );
    expect(validateBatch(files, 'image').ok).toBe(true);
  });
});
