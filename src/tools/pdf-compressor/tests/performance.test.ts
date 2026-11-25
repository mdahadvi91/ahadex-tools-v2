/**
 * Performance and editorial readability tests for PDF Compressor.
 */

import { describe, expect, it } from 'vitest';
import { FAQ, HOW_IT_WORKS, SECTIONS } from '../content';
import { validatePdfBuffer } from '../engine';
import { buildSchema } from '../schema';
import { pdfSavingsPercent } from '../types';

function benchmark(fn: () => void, iterations: number): number {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  return performance.now() - start;
}

describe('pdf-compressor pure helpers performance', () => {
  it('pdfSavingsPercent runs under 25ms for 10,000 calls', () => {
    const elapsed = benchmark(() => {
      pdfSavingsPercent(100_000, 62_000);
    }, 10_000);
    expect(elapsed).toBeLessThan(25);
  });

  it('validatePdfBuffer runs under 150ms for 2,000 header checks', () => {
    const sample = new TextEncoder().encode('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n').buffer;
    const elapsed = benchmark(() => {
      validatePdfBuffer(sample, 'sample.pdf');
    }, 2_000);
    expect(elapsed).toBeLessThan(150);
  });
});

describe('pdf-compressor content & schema budgets', () => {
  it('keeps content JSON under 50 KB and schema JSON under 30 KB', () => {
    expect(JSON.stringify({ SECTIONS, FAQ, HOW_IT_WORKS }).length).toBeLessThan(50 * 1024);
    expect(JSON.stringify(buildSchema('https://ahadex.online')).length).toBeLessThan(30 * 1024);
  });

  it('builds JSON-LD schema under 50ms for 1,000 calls', () => {
    const elapsed = benchmark(() => {
      buildSchema('https://ahadex.online');
    }, 1_000);
    expect(elapsed).toBeLessThan(50);
  });

  it('keeps section headings, paragraphs, and FAQ answers readable', () => {
    for (const section of SECTIONS) {
      expect(section.heading.length).toBeLessThan(80);
      for (const paragraph of section.paragraphs) {
        expect(paragraph.length).toBeLessThan(550);
      }
    }
    for (const item of FAQ) {
      expect(item.answer.length).toBeLessThan(350);
    }
  });
});
