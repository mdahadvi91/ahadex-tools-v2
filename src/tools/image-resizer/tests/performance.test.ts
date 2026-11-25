/**
 * Performance tests for Image Resizer.
 */

import { describe, it, expect } from 'vitest';
import { computeOutputDimensions, formatBytes } from '../types';
import { validateInput } from '../engine/validation';
import { SECTIONS, FAQ, HOW_IT_WORKS } from '../content';
import { buildSchema } from '../schema';

function bench(fn: () => void, iterations: number): number {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  return performance.now() - start;
}

describe('image-resizer pure helpers performance', () => {
  it('computeOutputDimensions under 200ms for 10k calls', () => {
    const elapsed = bench(() => {
      computeOutputDimensions(
        { width: 1920, height: 1080 },
        {
          format: 'webp',
          quality: 0.8,
          width: 800,
          height: null,
          maintainAspectRatio: true,
        },
      );
    }, 10_000);
    expect(elapsed).toBeLessThan(200);
  });

  it('formatBytes under 150ms for 10k calls', () => {
    const elapsed = bench(() => formatBytes(1024 * 1024), 10_000);
    expect(elapsed).toBeLessThan(150);
  });

  it('validateInput under 100ms for 10k calls', () => {
    const input = {
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
    const elapsed = bench(() => validateInput(input), 10_000);
    expect(elapsed).toBeLessThan(100);
  });
});

describe('image-resizer content size', () => {
  it('content JSON under 50 KB', () => {
    const json = JSON.stringify({ SECTIONS, FAQ, HOW_IT_WORKS });
    expect(json.length).toBeLessThan(50 * 1024);
  });

  it('schema JSON under 30 KB', () => {
    const json = JSON.stringify(buildSchema('https://ahadex.online'));
    expect(json.length).toBeLessThan(30 * 1024);
  });
});

describe('image-resizer readability', () => {
  it('paragraphs under 500 chars', () => {
    for (const s of SECTIONS) {
      for (const p of s.paragraphs) {
        expect(p.length).toBeLessThan(500);
      }
    }
  });

  it('FAQ answers under 300 chars', () => {
    for (const item of FAQ) {
      expect(item.answer.length).toBeLessThan(300);
    }
  });
});
