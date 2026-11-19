/**
 * Route registry. Static non-tool routes plus tool routes.
 * Uses fs in Node.js (SSR) and import.meta.glob in Vite (Browser).
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

const isNodeEnv =
  typeof (globalThis as any).process !== 'undefined' &&
  (globalThis as any).process.versions != null &&
  (globalThis as any).process.versions.node != null;

async function loadToolModules(): Promise<
  Record<string, { manifest: ToolManifest; default: AppRoute['Component'] }>
> {
  if (isNodeEnv) {
    // Node.js Environment (SSR)
    // @ts-ignore
    const fs = await import('node:fs');
    // @ts-ignore
    const path = await import('node:path');
    const toolsDir = path.resolve((globalThis as any).process.cwd(), 'src/tools');
    const modules: Record<string, any> = {};

    if (fs.existsSync(toolsDir)) {
      const toolDirs = fs
        .readdirSync(toolsDir)
        .filter((f: string) => fs.statSync(path.join(toolsDir, f)).isDirectory());
      for (const dir of toolDirs) {
        try {
          const mod = await import(`../tools/${dir}/index.ts`);
          modules[`../tools/${dir}/index.ts`] = mod;
        } catch (e) {
          console.warn(`⚠️ Failed to load tool module: ${dir}`, e);
        }
      }
    }
    return modules;
  } else {
    // Vite Environment (Browser)
    // @ts-ignore - Vite specific
    return import.meta.glob<{ manifest: ToolManifest; default: AppRoute['Component'] }>(
      '../tools/*/index.ts',
      { eager: true },
    );
  }
}

// Top-level await (supported in Node 14+ ESM)
const toolModules = await loadToolModules();

export const toolRoutes: AppRoute[] = Object.values(toolModules)
  .filter((mod) => mod.manifest && mod.manifest.status === 'live')
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
