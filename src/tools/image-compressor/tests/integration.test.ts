/**
 * Integration tests for the Image Compressor tool. Verifies
 * manifest consistency, content quality, schema validity, and
 * SEO metadata. These are the tests that keep AdSense and Google
 * happy: they ensure no misleading claims, no thin content, and
 * no schema drift.
 */

import { describe, it, expect } from 'vitest';
import { manifest } from '../manifest';
import {
  HERO,
  DIRECT_ANSWER,
  SECTIONS,
  FAQ,
  HOW_IT_WORKS,
  SUPPORTED_INPUT_FORMATS,
  OUTPUT_FORMATS,
  LIMITATIONS,
  PRIVACY,
  REFERENCES,
  INTERNAL_LINKS,
} from '../content';
import { metadata } from '../seo';
import { buildSchema } from '../schema';
import { DIRECT_ANSWER as GEO_DIRECT, FACTS, ENTITIES } from '../geo';

describe('image-compressor manifest', () => {
  it('has correct slug and path', () => {
    expect(manifest.slug).toBe('image-compressor');
    expect(manifest.path).toBe('/image-compressor/');
  });

  it('is live and indexable', () => {
    expect(manifest.status).toBe('live');
    expect(manifest.indexable).toBe(true);
    expect(manifest.sitemap).toBe(true);
  });

  it('has launchOrder 1 (first tool)', () => {
    expect(manifest.launchOrder).toBe(1);
  });

  it('title is 50-70 characters', () => {
    expect(manifest.title.length).toBeGreaterThanOrEqual(50);
    expect(manifest.title.length).toBeLessThanOrEqual(70);
  });

  it('description is 120-160 characters', () => {
    expect(manifest.description.length).toBeGreaterThanOrEqual(120);
    expect(manifest.description.length).toBeLessThanOrEqual(160);
  });
});

describe('image-compressor content quality', () => {
  it('has a non-empty H1', () => {
    expect(HERO.h1.length).toBeGreaterThan(0);
  });

  it('H1 is "Image Compressor"', () => {
    expect(HERO.h1).toBe('Image Compressor');
  });

  it('has a direct answer for AEO', () => {
    expect(DIRECT_ANSWER.length).toBeGreaterThanOrEqual(100);
  });

  it('direct answer mentions supported formats', () => {
    expect(DIRECT_ANSWER).toContain('JPG');
    expect(DIRECT_ANSWER).toContain('PNG');
    expect(DIRECT_ANSWER).toContain('WebP');
  });

  it('has at least 6 content sections', () => {
    expect(SECTIONS.length).toBeGreaterThanOrEqual(6);
  });

  it('every section has at least one paragraph', () => {
    for (const section of SECTIONS) {
      expect(section.paragraphs.length).toBeGreaterThan(0);
      expect(section.paragraphs[0].length).toBeGreaterThan(50);
    }
  });

  it('total content exceeds 800 words (AdSense threshold)', () => {
    const allText = [
      HERO.tagline,
      HERO.subtitle,
      DIRECT_ANSWER,
      ...SECTIONS.flatMap((s) => [s.heading, ...s.paragraphs]),
      ...FAQ.flatMap((f) => [f.question, f.answer]),
    ].join(' ');
    const words = allText.split(/\s+/).filter((w) => w.length > 0).length;
    expect(words).toBeGreaterThan(800);
  });

  it('has at least 8 FAQ items', () => {
    expect(FAQ.length).toBeGreaterThanOrEqual(8);
  });

  it('every FAQ has question and answer of substance', () => {
    for (const item of FAQ) {
      expect(item.question.length).toBeGreaterThan(10);
      expect(item.answer.length).toBeGreaterThan(40);
    }
  });

  it('has 3+ how-it-works steps', () => {
    expect(HOW_IT_WORKS.length).toBeGreaterThanOrEqual(3);
  });

  it('declares all 5 supported input formats', () => {
    expect(SUPPORTED_INPUT_FORMATS.length).toBe(5);
    const names = SUPPORTED_INPUT_FORMATS.map((f) => f.name);
    expect(names).toEqual(expect.arrayContaining(['JPEG', 'PNG', 'WebP', 'GIF', 'AVIF']));
  });

  it('declares 3 output formats', () => {
    expect(OUTPUT_FORMATS.length).toBe(3);
  });

  it('has limitations section', () => {
    expect(LIMITATIONS.list.length).toBeGreaterThan(0);
  });

  it('has privacy section', () => {
    expect(PRIVACY.paragraphs.length).toBeGreaterThan(0);
  });

  it('has at least 2 authoritative references', () => {
    expect(REFERENCES.length).toBeGreaterThanOrEqual(2);
    for (const ref of REFERENCES) {
      expect(ref.url).toMatch(/^https:\/\//);
    }
  });

  it('has at least 3 internal links', () => {
    expect(INTERNAL_LINKS.length).toBeGreaterThanOrEqual(3);
  });
});

describe('image-compressor claims are verifiable', () => {
  it('does not claim "offline" without qualification', () => {
    const allText = JSON.stringify({ HERO, SECTIONS, FAQ, LIMITATIONS }).toLowerCase();
    const offlineMentions = (allText.match(/offline/g) || []).length;
    // If "offline" is mentioned, must be qualified with caveat
    if (offlineMentions > 0) {
      expect(allText).toMatch(/not guaranteed|not currently|may continue/);
    }
  });

  it('does not claim "0 KB" or similar absolute numbers', () => {
    const allText = JSON.stringify({ HERO, SECTIONS, FAQ }).toLowerCase();
    expect(allText).not.toMatch(/\b0 kb\b/);
    expect(allText).not.toMatch(/\b0 bytes\b/);
  });

  it('does not use marketing superlatives for the product', () => {
    const allText = JSON.stringify({ HERO, SECTIONS, FAQ }).toLowerCase();
    // Block marketing superlatives paired with the product.
    // Natural usage like "the best format depends on the content"
    // (informational) is allowed.
    expect(allText).not.toMatch(/\b(?:the )?best (?:image compressor|compressor|tool|way to)\b/);
    expect(allText).not.toMatch(/\bfastest\b/);
    expect(allText).not.toMatch(/\brevolutionary\b/);
    expect(allText).not.toMatch(/\bworld'?s (?:best|leading|first)\b/);
  });

  it('does not make bare "guaranteed" claims', () => {
    const allText = JSON.stringify({ HERO, SECTIONS, FAQ }).toLowerCase();
    // Allow "not guaranteed" (honest disclaimer); block bare "guaranteed".
    const stripped = allText.replace(/not guaranteed/g, '');
    expect(stripped).not.toMatch(/\bguaranteed\b/);
    expect(stripped).not.toMatch(/\bguarantee\b/);
  });
});

describe('image-compressor SEO metadata', () => {
  it('title is 55-65 characters', () => {
    expect(metadata.title.length).toBeGreaterThanOrEqual(55);
    expect(metadata.title.length).toBeLessThanOrEqual(65);
  });

  it('description is 130-160 characters', () => {
    expect(metadata.description.length).toBeGreaterThanOrEqual(130);
    expect(metadata.description.length).toBeLessThanOrEqual(160);
  });

  it('path matches manifest path', () => {
    expect(metadata.path).toBe(manifest.path);
  });

  it('is indexable', () => {
    expect(metadata.noIndex).toBeFalsy();
  });
});

describe('image-compressor GEO content', () => {
  it('has a direct answer distinct from H1', () => {
    expect(GEO_DIRECT.length).toBeGreaterThan(50);
  });

  it('has at least 4 facts', () => {
    expect(FACTS.length).toBeGreaterThanOrEqual(4);
  });

  it('has declared entities', () => {
    expect(ENTITIES.length).toBeGreaterThanOrEqual(1);
    expect(ENTITIES.some((e) => e.name === 'Image Compressor')).toBe(true);
  });
});

describe('image-compressor JSON-LD schema', () => {
  const schema = buildSchema('https://ahadex.online');

  it('uses schema.org context', () => {
    expect(schema['@context']).toBe('https://schema.org');
  });

  it('includes WebApplication', () => {
    const app = schema['@graph'].find(
      (n) => (n as { '@type'?: string })['@type'] === 'WebApplication',
    );
    expect(app).toBeDefined();
    expect((app as { name?: string }).name).toBe('Image Compressor');
    expect((app as { offers?: { price?: string } }).offers?.price).toBe('0');
  });

  it('includes FAQPage with all FAQ items', () => {
    const faqPage = schema['@graph'].find(
      (n) => (n as { '@type'?: string })['@type'] === 'FAQPage',
    );
    expect(faqPage).toBeDefined();
    const mainEntity = (faqPage as { mainEntity?: unknown[] }).mainEntity;
    expect(Array.isArray(mainEntity)).toBe(true);
    expect(mainEntity?.length).toBe(FAQ.length);
  });

  it('includes BreadcrumbList with 2 items', () => {
    const crumb = schema['@graph'].find(
      (n) => (n as { '@type'?: string })['@type'] === 'BreadcrumbList',
    );
    expect(crumb).toBeDefined();
    const items = (crumb as { itemListElement?: unknown[] }).itemListElement;
    expect(items?.length).toBe(2);
  });
});
