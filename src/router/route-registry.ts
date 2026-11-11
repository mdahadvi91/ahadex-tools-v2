/**
 * Route registry. Static non-tool routes plus tool routes discovered
 * at build time via Vite's import.meta.glob.
 */

import type { AppRoute, RouteMeta } from './route-types';

export interface ToolManifest {
  slug: string;
  path: string;
  title: string;
  description: string;
  indexable: boolean;
  sitemap: boolean;
  status: 'draft' | 'live' | 'deprecated';
  launchOrder: number;
  requiresConsent: boolean;
}

export interface ToolEntry {
  manifest: ToolManifest;
  Page: AppRoute['Component'];
}

const toolModules = import.meta.glob<{ manifest: ToolManifest; default: AppRoute['Component'] }>(
  '../tools/*/index.ts',
  { eager: true },
);

export const toolRoutes: AppRoute[] = Object.values(toolModules)
  .filter((mod) => mod.manifest.status === 'live')
  .sort((a, b) => a.manifest.launchOrder - b.manifest.launchOrder)
  .map((mod) => ({
    path: mod.manifest.path,
    Component: mod.default,
    meta: {
      path: mod.manifest.path,
      title: mod.manifest.title,
      description: mod.manifest.description,
      indexable: mod.manifest.indexable,
      sitemap: mod.manifest.sitemap,
    } satisfies RouteMeta,
  }));

export function getToolRoutes(): readonly AppRoute[] {
  return toolRoutes;
}
