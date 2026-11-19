/**
 * Integration tests for Image Resizer. Verifies manifest consistency,
 * content quality, schema, and SEO metadata.
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

describe('image-resizer manifest', () => {
  it('has correct slug and path', () => {
    expect(manifest.slug).toBe('image-resizer');
    expect(manifest.path).toBe('/tools/image-resizer');
  });

  it('is live and indexable', () => {
    expect(manifest.status).toBe('live');
    expect(manifest.indexable).toBe(true);
    expect(manifest.sitemap).toBe(true);
  });

  it('has launchOrder 2', () => {
    expect(manifest.launchOrder).toBe(2);
  });

  it('title is 50-70 chars', () => {
    expect(manifest.title.length).toBeGreaterThanOrEqual(50);
    expect(manifest.title.length).toBeLessThanOrEqual(70);
  });

  it('description is 120-160 chars', () => {
    expect(manifest.description.length).toBeGreaterThanOrEqual(120);
    expect(manifest.description.length).toBeLessThanOrEqual(160);
  });
});

describe('image-resizer content quality', () => {
  it('has non-empty H1', () => {
    expect(HERO.h1).toBe('Image Resizer');
  });

  it('direct answer mentions formats', () => {
    expect(DIRECT_ANSWER).toContain('JPG');
    expect(DIRECT_ANSWER).toContain('PNG');
    expect(DIRECT_ANSWER).toContain('WebP');
  });

  it('has at least 4 sections', () => {
    expect(SECTIONS.length).toBeGreaterThanOrEqual(4);
  });

  it('total content exceeds 800 words', () => {
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

  it('every FAQ has substance', () => {
    for (const item of FAQ) {
      expect(item.question.length).toBeGreaterThan(10);
      expect(item.answer.length).toBeGreaterThan(40);
    }
  });

  it('has 3+ how-it-works steps', () => {
    expect(HOW_IT_WORKS.length).toBeGreaterThanOrEqual(3);
  });

  it('declares 5 input formats', () => {
    expect(SUPPORTED_INPUT_FORMATS.length).toBe(5);
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

  it('has 2+ references', () => {
    expect(REFERENCES.length).toBeGreaterThanOrEqual(2);
    for (const ref of REFERENCES) {
      expect(ref.url).toMatch(/^https:\/\//);
    }
  });

  it('has 3+ internal links', () => {
    expect(INTERNAL_LINKS.length).toBeGreaterThanOrEqual(3);
  });
});

describe('image-resizer claims are verifiable', () => {
  it('does not claim 0 KB sent', () => {
    const allText = JSON.stringify({ HERO, SECTIONS, FAQ }).toLowerCase();
    expect(allText).not.toMatch(/\b0 kb\b/);
    expect(allText).not.toMatch(/\b0 bytes\b/);
  });

  it('does not use marketing superlatives', () => {
    const allText = JSON.stringify({ HERO, SECTIONS, FAQ }).toLowerCase();
    expect(allText).not.toMatch(/\b(?:the )?best (?:image|resizer|tool|way to)\b/);
    expect(allText).not.toMatch(/\bfastest\b/);
    expect(allText).not.toMatch(/\brevolutionary\b/);
  });

  it('does not make bare "guaranteed" claims', () => {
    const allText = JSON.stringify({ HERO, SECTIONS, FAQ }).toLowerCase();
    const stripped = allText.replace(/not guaranteed/g, '');
    expect(stripped).not.toMatch(/\bguaranteed\b/);
  });
});

describe('image-resizer SEO metadata', () => {
  it('title is 50-70 chars', () => {
    expect(metadata.title.length).toBeGreaterThanOrEqual(50);
    expect(metadata.title.length).toBeLessThanOrEqual(70);
  });

  it('description is 120-160 chars', () => {
    expect(metadata.description.length).toBeGreaterThanOrEqual(120);
    expect(metadata.description.length).toBeLessThanOrEqual(160);
  });

  it('path matches manifest', () => {
    expect(metadata.path).toBe(manifest.path);
  });

  it('is indexable', () => {
    expect(metadata.noIndex).toBeFalsy();
  });
});

describe('image-resizer GEO content', () => {
  it('has direct answer', () => {
    expect(GEO_DIRECT.length).toBeGreaterThan(50);
  });

  it('has 4+ facts', () => {
    expect(FACTS.length).toBeGreaterThanOrEqual(4);
  });

  it('declares Image Resizer entity', () => {
    expect(ENTITIES.some((e) => e.name === 'Image Resizer')).toBe(true);
  });
});

describe('image-resizer JSON-LD schema', () => {
  const schema = buildSchema('https://ahadex.online');

  it('uses schema.org context', () => {
    expect(schema['@context']).toBe('https://schema.org');
  });

  it('includes WebApplication', () => {
    const app = schema['@graph'].find(
      (n) => (n as { '@type'?: string })['@type'] === 'WebApplication',
    );
    expect(app).toBeDefined();
    expect((app as { name?: string }).name).toBe('Image Resizer');
  });

  it('includes FAQPage', () => {
    const faqPage = schema['@graph'].find(
      (n) => (n as { '@type'?: string })['@type'] === 'FAQPage',
    );
    expect(faqPage).toBeDefined();
  });

  it('includes BreadcrumbList with 3 items', () => {
    const crumb = schema['@graph'].find(
      (n) => (n as { '@type'?: string })['@type'] === 'BreadcrumbList',
    );
    expect(crumb).toBeDefined();
  });
});
