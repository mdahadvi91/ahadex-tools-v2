/**
 * Integration test: metadata. Verifies tool SEO metadata is valid
 * and consistent with the manifest.
 */

import { describe, it, expect } from 'vitest';
import { discoverTools } from '../../scripts/utils/route-discovery';
import { manifest as imageCompressorManifest } from '../../src/tools/image-compressor/manifest';
import { metadata as imageCompressorMetadata } from '../../src/tools/image-compressor/seo';

describe('metadata: image-compressor', () => {
  it('title is 50-70 characters', () => {
    expect(imageCompressorManifest.title.length).toBeGreaterThanOrEqual(50);
    expect(imageCompressorManifest.title.length).toBeLessThanOrEqual(70);
  });

  it('description is 120-160 characters', () => {
    expect(imageCompressorManifest.description.length).toBeGreaterThanOrEqual(120);
    expect(imageCompressorManifest.description.length).toBeLessThanOrEqual(160);
  });

  it('metadata title is unique across tools', async () => {
    const { tools } = await discoverTools();
    const titles = tools.map((t) => t.manifest.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('metadata path matches manifest path', () => {
    expect(imageCompressorMetadata.path).toBe(imageCompressorManifest.path);
  });

  it('metadata is indexable', () => {
    expect(imageCompressorMetadata.noIndex).toBeFalsy();
  });

  it('metadata has og:image path', () => {
    expect(imageCompressorMetadata.image).toBeTruthy();
    expect(imageCompressorMetadata.image?.startsWith('/')).toBe(true);
  });

  it('metadata type is website', () => {
    expect(imageCompressorMetadata.type).toBe('website');
  });
});
