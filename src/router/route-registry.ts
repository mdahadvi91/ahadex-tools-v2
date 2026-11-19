/**
 * Route registry.
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
  typeof (globalThis as unknown as { process?: { versions?: { node?: string } } }).process?.versions
    ?.node !== 'undefined';

const nodeModules: Record<string, { manifest: ToolManifest; default: AppRoute['Component'] }> = {};

if (isNodeEnv) {
  try {
    const nodeProcess = (globalThis as unknown as { process: { cwd: () => string } }).process;
    const toolsDir = nodeProcess.cwd() + '/src/tools';

    // Use createRequire to satisfy ESLint and avoid top-level await
    const { createRequire } = await import('node:module');
    const require = createRequire(import.meta.url);
    const fs = require('node:fs');
    const path = require('node:path');

    if (fs.existsSync(toolsDir)) {
      const toolDirs = fs
        .readdirSync(toolsDir)
        .filter((f: string) => fs.statSync(path.join(toolsDir, f)).isDirectory());
      for (const dir of toolDirs) {
        try {
          const mod = require(`../tools/${dir}/index.ts`);
          nodeModules[`../tools/${dir}/index.ts`] = mod;
        } catch (e) {
          console.warn(`⚠️ Failed to load tool module: ${dir}`, e);
        }
      }
    }
  } catch (e) {
    console.warn('⚠️ Node.js module loading failed', e);
  }
}

// Vite environment (browser)
const viteModules = !isNodeEnv
  ? import.meta.glob<{ manifest: ToolManifest; default: AppRoute['Component'] }>(
      '../tools/*/index.ts',
      { eager: true },
    )
  : {};

const toolModules = isNodeEnv ? nodeModules : viteModules;

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
