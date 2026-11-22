import type { ToolManifest } from '../config/tools';
import type { AppRoute, RouteMeta } from './route-types';

interface ToolModule {
  manifest: ToolManifest;
  default: AppRoute['Component'];
}

// Vite glob (browser/build)
const rawModules = import.meta.glob<ToolModule>('../tools/*/index.ts', { eager: true });

export const toolRoutes: AppRoute[] = Object.values(rawModules)
  .filter((mod): mod is ToolModule => Boolean(mod && mod.manifest && mod.manifest.status === 'live'))
  .sort((a, b) => a.manifest.launchOrder - b.manifest.launchOrder)
  .map((mod) => {
    const meta: RouteMeta = {
      path: mod.manifest.path,
      title: mod.manifest.title,
      description: mod.manifest.description,
      indexable: mod.manifest.indexable,
      sitemap: mod.manifest.sitemap,
    };

    return {
      path: mod.manifest.path,
      Component: mod.default,
      meta,
    };
  });
