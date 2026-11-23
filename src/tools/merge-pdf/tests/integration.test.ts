import { describe, expect, it } from 'vitest';
import {
  DIRECT_ANSWER,
  FAQ,
  HERO,
  HOW_IT_WORKS,
  INTERNAL_LINKS,
  LIMITATIONS,
  PRIVACY,
  REFERENCES,
  SECTIONS,
} from '../content';
import { DIRECT_ANSWER as GEO_DIRECT, ENTITIES, FACTS } from '../geo';
import { manifest } from '../manifest';
import { metadata as toolMetadata } from '../metadata';
import { buildSchema } from '../schema';
import { metadata as seoMetadata } from '../seo';

describe('merge-pdf manifest and metadata', () => {
  it('has valid slug, trailing-slash path, and live status', () => {
    expect(manifest.slug).toBe('merge-pdf');
    expect(manifest.path).toBe('/merge-pdf/');
    expect(manifest.status).toBe('live');
    expect(manifest.indexable).toBe(true);
    expect(manifest.sitemap).toBe(true);
    expect(toolMetadata.canonical).toBe('https://ahadex.online/merge-pdf/');
  });

  it('keeps manifest and SEO title/description within search bounds', () => {
    expect(manifest.title.length).toBeGreaterThanOrEqual(50);
    expect(manifest.title.length).toBeLessThanOrEqual(70);
    expect(manifest.description.length).toBeGreaterThanOrEqual(120);
    expect(manifest.description.length).toBeLessThanOrEqual(160);
    expect(seoMetadata.title.length).toBeGreaterThanOrEqual(50);
    expect(seoMetadata.title.length).toBeLessThanOrEqual(65);
    expect(seoMetadata.description.length).toBeGreaterThanOrEqual(125);
    expect(seoMetadata.description.length).toBeLessThanOrEqual(160);
  });
});

describe('merge-pdf content quality and schema', () => {
  it('exceeds 800 words of substantive documentation', () => {
    const text = [
      HERO.tagline,
      HERO.subtitle,
      DIRECT_ANSWER,
      ...SECTIONS.flatMap((s) => [s.heading, ...s.paragraphs, ...(s.list ?? [])]),
      ...FAQ.flatMap((f) => [f.question, f.answer]),
    ].join(' ');
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    expect(wordCount).toBeGreaterThan(800);
  });

  it('includes complete supporting sections and internal links', () => {
    expect(SECTIONS.length).toBeGreaterThanOrEqual(6);
    expect(FAQ.length).toBeGreaterThanOrEqual(8);
    expect(HOW_IT_WORKS.length).toBeGreaterThanOrEqual(3);
    expect(LIMITATIONS.list.length).toBeGreaterThanOrEqual(3);
    expect(PRIVACY.paragraphs.length).toBeGreaterThanOrEqual(2);
    expect(REFERENCES.length).toBeGreaterThanOrEqual(2);
    expect(INTERNAL_LINKS.length).toBeGreaterThanOrEqual(3);
    expect(GEO_DIRECT.length).toBeGreaterThan(50);
    expect(FACTS.length).toBeGreaterThanOrEqual(4);
    expect(ENTITIES.some((e) => e.name === 'Merge PDF')).toBe(true);
  });

  it('generates valid JSON-LD graph with trailing-slash canonical URLs', () => {
    const schema = buildSchema('https://ahadex.online');
    expect(schema['@context']).toBe('https://schema.org');
    const faq = schema['@graph'].find((n) => n['@type'] === 'FAQPage') as {
      mainEntity?: unknown[];
    };
    expect(faq?.mainEntity?.length).toBe(FAQ.length);
  });
});
