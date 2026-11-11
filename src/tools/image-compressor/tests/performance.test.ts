/**
 * Performance tests for the Image Compressor tool. Verifies that
 * pure helpers run fast enough and that content/JSON-LD structures
 * stay within reasonable size limits.
 */

import { describe, it, expect } from 'vitest';
import {
  presetToOptions,
  formatBytes,
  savingsPercent,
} from '../types';
import { validateInput } from '../engine/validation';
import { SECTIONS, FAQ, HOW_IT_WORKS } from '../content';
import { buildSchema } from '../schema';

function benchmark(fn: () => void, iterations: number): number {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  return performance.now() - start;
}

describe('image-compressor pure helpers performance', () => {
  it('presetToOptions runs in under 10ms for 10000 calls', () => {
    const elapsed = benchmark(() => {
      presetToOptions('balanced', 1024 * 1024);
    }, 10000);
    expect(elapsed).toBeLessThan(10);
  });

  it('formatBytes runs in under 5ms for 10000 calls', () => {
    const elapsed = benchmark(() => {
      formatBytes(1024 * 1024);
    }, 10000);
    expect(elapsed).toBeLessThan(5);
  });

  it('savingsPercent runs in under 5ms for 10000 calls', () => {
    const elapsed = benchmark(() => {
      savingsPercent(1000, 500);
    }, 10000);
    expect(elapsed).toBeLessThan(5);
  });

  it('validateInput runs in under 20ms for 10000 calls', () => {
    const input = {
      bytes: new ArrayBuffer(1024),
      inputMime: 'image/png' as const,
      fileName: 'test.png',
      options: { format: 'webp' as const, quality: 0.8, resizeToMaxDimension: null },
    };
    const elapsed = benchmark(() => {
      validateInput(input);
    }, 10000);
    expect(elapsed).toBeLessThan(20);
  });
});

describe('image-compressor content size limits', () => {
  it('content JSON is under 50 KB', () => {
    const json = JSON.stringify({ SECTIONS, FAQ, HOW_IT_WORKS });
    expect(json.length).toBeLessThan(50 * 1024);
  });

  it('schema JSON is under 30 KB', () => {
    const json = JSON.stringify(buildSchema('https://ahadex.online'));
    expect(json.length).toBeLessThan(30 * 1024);
  });

  it('schema renders in under 10ms for 1000 calls', () => {
    const elapsed = benchmark(() => {
      buildSchema('https://ahadex.online');
    }, 1000);
    expect(elapsed).toBeLessThan(10);
  });
});

describe('image-compressor section readability', () => {
  it('no paragraph exceeds 500 characters (readability)', () => {
    for (const section of SECTIONS) {
      for (const paragraph of section.paragraphs) {
        expect(paragraph.length).toBeLessThan(500);
      }
    }
  });

  it('no FAQ answer exceeds 300 characters (readability)', () => {
    for (const item of FAQ) {
      expect(item.answer.length).toBeLessThan(300);
    }
  });

  it('headings are under 80 characters', () => {
    for (const section of SECTIONS) {
      expect(section.heading.length).toBeLessThan(80);
    }
  });
});
