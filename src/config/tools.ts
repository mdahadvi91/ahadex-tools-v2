/**
 * Tool types shared across the app.
 *
 * This file does not enumerate tools. Live tool discovery happens via
 * import.meta.glob in src/router/route-registry.ts. Types here are the
 * contract consumed by tools, the router and the sitemap generator.
 */

export type ToolStatus = 'draft' | 'live' | 'deprecated';

export interface ToolManifest {
  slug: string;
  path: string;
  title: string;
  description: string;
  indexable: boolean;
  sitemap: boolean;
  status: ToolStatus;
  launchOrder: number;
  requiresConsent: boolean;
}

export function isValidManifest(manifest: Partial<ToolManifest>): boolean {
  return (
    typeof manifest.slug === 'string' &&
    manifest.slug.length > 0 &&
    typeof manifest.path === 'string' &&
    manifest.path.startsWith('/tools/') &&
    typeof manifest.title === 'string' &&
    manifest.title.length > 0 &&
    typeof manifest.description === 'string' &&
    typeof manifest.indexable === 'boolean' &&
    typeof manifest.sitemap === 'boolean' &&
    (manifest.status === 'draft' ||
      manifest.status === 'live' ||
      manifest.status === 'deprecated') &&
    typeof manifest.launchOrder === 'number' &&
    typeof manifest.requiresConsent === 'boolean'
  );
}
