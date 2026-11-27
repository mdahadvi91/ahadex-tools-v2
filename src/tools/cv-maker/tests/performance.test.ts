/**
 * Performance and editorial readability tests for CV Maker.
 */

import { describe, expect, it } from 'vitest';
import { FAQ, HOW_IT_WORKS, SECTIONS } from '../content';
import { createCvFormFromPreset } from '../data/professions';
import { getTemplateById } from '../data/templates';
import { generateCvPdf, wrapTextLines } from '../engine';
import { buildSchema } from '../schema';

function benchmark(fn: () => void, iterations: number): number {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  return performance.now() - start;
}

describe('cv-maker pure helpers and PDF generation performance', () => {
  it('wrapTextLines runs under 150ms for 2,000 invocations', () => {
    const sample =
      'Product-focused Software Engineer experienced in TypeScript services, edge caching, and accessible frontend architecture.';
    const elapsed = benchmark(() => {
      wrapTextLines(sample, 240, (c) => c.length * 5.2);
    }, 2_000);
    expect(elapsed).toBeLessThan(150);
  });

  it('generates a complete A4 CV PDF within 500ms', async () => {
    const data = createCvFormFromPreset('software-engineer');
    const result = await generateCvPdf({
      data,
      template: getTemplateById('obsidian-rail'),
    });
    expect(result.durationMs).toBeLessThan(500);
  });
});

describe('cv-maker content & schema budgets', () => {
  it('keeps content JSON under 50 KB and schema JSON under 30 KB', () => {
    expect(JSON.stringify({ SECTIONS, FAQ, HOW_IT_WORKS }).length).toBeLessThan(50 * 1024);
    expect(JSON.stringify(buildSchema('https://ahadex.online')).length).toBeLessThan(30 * 1024);
  });

  it('builds JSON-LD schema under 250ms for 1,000 calls', () => {
    const elapsed = benchmark(() => {
      buildSchema('https://ahadex.online');
    }, 1_000);
    expect(elapsed).toBeLessThan(250);
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
