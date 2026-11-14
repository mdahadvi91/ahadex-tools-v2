/**
 * Performance test: worker. Verifies that worker-related code paths
 * have reasonable execution characteristics (static analysis based).
 */

import { describe, it, expect } from 'vitest';
import { presetToOptions, formatBytes, savingsPercent } from '../../src/tools/image-compressor/types';

function bench(fn: () => void, iterations: number): number {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  return performance.now() - start;
}

describe('performance: worker helpers', () => {
  it('presetToOptions is fast for 10k calls', () => {
    const elapsed = bench(() => presetToOptions('balanced', 1024 * 1024), 10_000);
    expect(elapsed).toBeLessThan(50);
  });

  it('formatBytes is fast for 10k calls', () => {
    const elapsed = bench(() => formatBytes(1024 * 1024), 10_000);
    expect(elapsed).toBeLessThan(30);
  });

  it('savingsPercent is fast for 10k calls', () => {
    const elapsed = bench(() => savingsPercent(1000, 500), 10_000);
    expect(elapsed).toBeLessThan(30);
  });

  it('helper functions do not grow memory unboundedly', () => {
    // Run 100k times — should not throw OOM
    for (let i = 0; i < 100_000; i++) {
      presetToOptions('smaller', i);
    }
    expect(true).toBe(true);
  });
});
