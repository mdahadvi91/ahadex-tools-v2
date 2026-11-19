/**
 * Route registry.
 */

import type * as NodeFs from 'node:fs';
import type * as NodePath from 'node:path';
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

// Built at runtime so the browser bundler never tries to resolve Node built-ins.
const nodeBuiltin = (name: string): string => `node:${name}`;

async function loadToolModules(): Promise<
  Record<string, { manifest: ToolManifest; default: AppRoute['Component'] }>
> {
  const modules: Record<string, { manifest: ToolManifest; default: AppRoute['Component'] }> = {};

  if (isNodeEnv) {
    const nodeProcess = (globalThis as unknown as { process: { cwd: () => string } }).process;
    const fs = (await import(/* @vite-ignore */ nodeBuiltin('fs'))) as typeof NodeFs;
    const path = (await import(/* @vite-ignore */ nodeBuiltin('path'))) as typeof NodePath;
    const toolsDir = path.resolve(nodeProcess.cwd(), 'src/tools');

    if (fs.existsSync(toolsDir)) {
      const toolDirs = fs
        .readdirSync(toolsDir)
        .filter((f: string) => fs.statSync(path.join(toolsDir, f)).isDirectory());
      for (const dir of toolDirs) {
        try {
          const mod = await import(/* @vite-ignore */ `../tools/${dir}/index.ts`);
          modules[`../tools/${dir}/index.ts`] = mod as {
            manifest: ToolManifest;
            default: AppRoute['Component'];
          };
        } catch (e) {
          console.warn(`⚠️ Failed to load tool module: ${dir}`, e);
        }
      }
    }
  } else {
    const globModules = import.meta.glob<{
      manifest: ToolManifest;
      default: AppRoute['Component'];
    }>('../tools/*/index.ts', { eager: true });
    Object.assign(modules, globModules);
  }
  return modules;
}

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
