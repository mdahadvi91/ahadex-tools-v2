/**
 * Integration test: tool registry. Verifies the tool manifest contract
 * and that the registry integrates correctly with route discovery.
 */

import { describe, it, expect } from 'vitest';
import { isValidManifest } from '../../src/config/tools';
import { manifest as imageCompressorManifest } from '../../src/tools/image-compressor/manifest';

describe('tool-registry: manifest contract', () => {
  it('image-compressor manifest passes validation', () => {
    expect(isValidManifest(imageCompressorManifest)).toBe(true);
  });

  it('manifest has all required fields', () => {
    expect(imageCompressorManifest.slug).toBeTruthy();
    expect(imageCompressorManifest.path).toBeTruthy();
    expect(imageCompressorManifest.title).toBeTruthy();
    expect(imageCompressorManifest.description).toBeTruthy();
    expect(typeof imageCompressorManifest.indexable).toBe('boolean');
    expect(typeof imageCompressorManifest.sitemap).toBe('boolean');
    expect(imageCompressorManifest.status).toBe('live');
    expect(typeof imageCompressorManifest.launchOrder).toBe('number');
    expect(typeof imageCompressorManifest.requiresConsent).toBe('boolean');
  });

  it('launchOrder is positive', () => {
    expect(imageCompressorManifest.launchOrder).toBeGreaterThan(0);
  });

  it('path follows /tools/<slug> pattern', () => {
    expect(imageCompressorManifest.path).toBe(`/tools/${imageCompressorManifest.slug}`);
  });

  it('invalid manifest fails validation', () => {
    expect(isValidManifest({})).toBe(false);
    expect(isValidManifest({ slug: '' })).toBe(false);
    expect(isValidManifest({ slug: 'x', path: 'not-a-tool-path' })).toBe(false);
  });
});

describe('tool-registry: content integrity', () => {
  it('tool has required content files', async () => {
    const files = await import('node:fs/promises').then((m) =>
      m.readdir('src/tools/image-compressor'),
    );
    expect(files).toContain('content.ts');
    expect(files).toContain('FAQ.tsx');
    expect(files).toContain('Content.tsx');
    expect(files).toContain('Hero.tsx');
    expect(files).toContain('Page.tsx');
    expect(files).toContain('index.ts');
    expect(files).toContain('manifest.ts');
  });

  it('tool has engine directory', async () => {
    const files = await import('node:fs/promises').then((m) =>
      m.readdir('src/tools/image-compressor/engine'),
    );
    expect(files).toContain('compressor.ts');
    expect(files).toContain('validation.ts');
    expect(files).toContain('worker.ts');
    expect(files).toContain('index.ts');
  });
});
