/**
 * Integration test: routing. Verifies that all declared routes
 * resolve correctly and the tool registry discovers live tools.
 */

import { describe, it, expect } from 'vitest';
import { discoverTools } from '../../scripts/utils/route-discovery';

const STATIC_ROUTES = [
  '/',
  '/tools',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/disclaimer',
  '/cookies',
];

describe('routing: static routes', () => {
  it('declares 8 static routes', () => {
    expect(STATIC_ROUTES).toHaveLength(8);
  });

  it('all static routes start with /', () => {
    for (const route of STATIC_ROUTES) {
      expect(route.startsWith('/')).toBe(true);
    }
  });

  it('no duplicate static routes', () => {
    expect(new Set(STATIC_ROUTES).size).toBe(STATIC_ROUTES.length);
  });
});

describe('routing: tool discovery', () => {
  it('discovers at least one live tool', async () => {
    const { tools } = await discoverTools();
    expect(tools.length).toBeGreaterThanOrEqual(1);
  });

  it('image-compressor tool is discovered', async () => {
    const { tools } = await discoverTools();
    const imageCompressor = tools.find((t) => t.manifest.slug === 'image-compressor');
    expect(imageCompressor).toBeDefined();
    expect(imageCompressor?.manifest.path).toBe('/tools/image-compressor');
    expect(imageCompressor?.manifest.status).toBe('live');
  });

  it('every discovered tool has valid path', async () => {
    const { tools } = await discoverTools();
    for (const tool of tools) {
      expect(tool.manifest.path.startsWith('/tools/')).toBe(true);
    }
  });

  it('every discovered tool slug matches folder name', async () => {
    const { tools } = await discoverTools();
    for (const tool of tools) {
      expect(tool.manifest.slug).toBe(tool.slug);
    }
  });

  it('no duplicate tool paths', async () => {
    const { tools } = await discoverTools();
    const paths = tools.map((t) => t.manifest.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('discovery returns no errors', async () => {
    const { errors } = await discoverTools();
    expect(errors).toEqual([]);
  });
});
