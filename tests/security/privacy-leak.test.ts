/**
 * Security test: privacy leak prevention. Verifies that file names
 * and contents are never logged or transmitted.
 */

import { describe, it, expect } from 'vitest';
import { filterPayload } from '../../src/platform/analytics/privacy-filter';
import { minimize } from '../../src/platform/privacy/data-minimization';

describe('security: privacy leak prevention', () => {
  it('filterPayload strips filenames', () => {
    const filtered = filterPayload({
      fileName: 'secret-doc.png',
      fileType: 'png',
    });
    expect(filtered).toEqual({});
  });

  it('filterPayload strips email', () => {
    const filtered = filterPayload({
      email: 'test@example.com',
      event: 'click',
    });
    expect(filtered).toEqual({});
  });

  it('minimize strips nested file names', () => {
    const minimized = minimize({
      event: 'process',
      file: { name: 'secret.png', content: 'leaked' },
    }) as Record<string, unknown>;
    expect(JSON.stringify(minimized)).not.toContain('secret');
  });

  it('minimize truncates long strings', () => {
    const long = 'a'.repeat(500);
    const minimized = minimize({ path: long }) as Record<string, unknown>;
    const val = minimized.path as string;
    expect(val.length).toBeLessThanOrEqual(203);
  });

  it('privacy filter strips PII inside arrays', () => {
    const filtered = filterPayload({
      events: [{ email: 'x@y.com', action: 'click' }],
    });
    // PII stripped recursively; safe keys preserved
    expect(JSON.stringify(filtered)).not.toContain('x@y.com');
  });

  it('safe keys pass through unchanged', () => {
    const filtered = filterPayload({
      toolId: 'image-compressor',
      durationMs: 1200,
    });
    expect(filtered).toEqual({
      toolId: 'image-compressor',
      durationMs: 1200,
    });
  });
});
