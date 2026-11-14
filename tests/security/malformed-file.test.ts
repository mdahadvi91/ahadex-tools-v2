/**
 * Security test: malformed file handling.
 */

import { describe, it, expect } from 'vitest';
import { validateSingleFile } from '../../src/platform/security/file-policy';
import { validateInput } from '../../src/tools/image-compressor/engine/validation';

function makeFile(name: string, type: string, content: string | Uint8Array): File {
  const blob =
    typeof content === 'string' ? new Blob([content], { type }) : new Blob([content], { type });
  return new File([blob], name, { type });
}

describe('security: malformed file handling', () => {
  it('handles truncated PNG header', () => {
    const truncated = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const file = makeFile('truncated.png', 'image/png', truncated);
    expect(() => validateSingleFile(file, 'image')).not.toThrow();
  });

  it('handles random bytes as image', () => {
    const random = new Uint8Array(100);
    for (let i = 0; i < random.length; i++) random[i] = Math.floor(Math.random() * 256);
    const file = makeFile('random.png', 'image/png', random);
    expect(() => validateSingleFile(file, 'image')).not.toThrow();
  });

  it('handles UTF-8 text as image', () => {
    const file = makeFile('text.png', 'image/png', 'not a real image');
    expect(() => validateSingleFile(file, 'image')).not.toThrow();
  });

  it('handles binary zero padding', () => {
    const zeros = new Uint8Array(1024);
    const file = makeFile('zeros.png', 'image/png', zeros);
    expect(() => validateSingleFile(file, 'image')).not.toThrow();
  });

  it('engine validates malformed input without crashing', () => {
    const issues = validateInput({
      bytes: new Uint8Array([1, 2, 3, 4, 5]).buffer,
      inputMime: 'image/png',
      fileName: 'fake.png',
      options: { format: 'webp', quality: 0.8, resizeToMaxDimension: null },
    });
    expect(Array.isArray(issues)).toBe(true);
  });
});
