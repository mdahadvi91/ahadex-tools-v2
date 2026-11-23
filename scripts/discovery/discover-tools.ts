/**
 * Filesystem tool and route discovery CLI + API.
 * Scans src/tools/[slug]/index.ts and merges with core static pages
 * without relying on Vite-only import.meta.glob.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  discoverPublishedRoutes,
  discoverToolsFromFilesystem,
  type DiscoveredRoute,
  type DiscoveredToolEntry,
} from '../utils/route-discovery';

export interface DiscoverySnapshot {
  readonly generatedAt: string;
  readonly toolsCount: number;
  readonly liveToolsCount: number;
  readonly routesCount: number;
  readonly tools: readonly DiscoveredToolEntry[];
  readonly routes: readonly DiscoveredRoute[];
}

export async function collectDiscoverySnapshot(toolsRoot?: string): Promise<DiscoverySnapshot> {
  const tools = await discoverToolsFromFilesystem(toolsRoot);
  const routes = await discoverPublishedRoutes(toolsRoot);

  return {
    generatedAt: new Date().toISOString(),
    toolsCount: tools.length,
    liveToolsCount: tools.filter((t) => t.implemented && t.status === 'live').length,
    routesCount: routes.length,
    tools,
    routes,
  };
}

const isDirectExecution =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  const snapshot = await collectDiscoverySnapshot();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(snapshot, null, 2));
  } else {
    console.log(
      `Discovered ${snapshot.liveToolsCount}/${snapshot.toolsCount} live tools and ${snapshot.routesCount} published routes:`,
    );
    for (const route of snapshot.routes) {
      console.log(`  [${route.kind}] ${route.path} -> ${route.canonicalUrl}`);
    }
  }
}
