/**
 * Filesystem-based tool and route discovery utility for Node.js scripts (tsx).
 * Avoids Vite-only `import.meta.glob` so CLI scripts, sitemap generation,
 * prerendering, and audits execute reliably in Node.js without runtime crashes.
 *
 * Input: `src/tools/` directory on disk and `STATIC_PAGE_ROUTES` from `config/site.config.ts`.
 * Output: Discovered tool descriptors (including live vs draft/incomplete tools) and full route list.
 * Failure behavior: Never crashes on incomplete `TODO` stub directories; flags stubbed/malformed
 * tools explicitly in discovery metadata so downstream validators can handle or fail cleanly.
 */

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  STATIC_PAGE_ROUTES,
  buildCanonicalUrl,
  normalizeRoutePath,
  type StaticPageRouteConfig,
} from '../../config/site.config';
import type { ToolMetadata, ToolStatus } from '../../src/types/tool';
import { fileExists, listSubdirectories, readTextFile, resolveFromRoot } from './file-utils';

export interface DiscoveredToolEntry {
  readonly slug: string;
  readonly directory: string;
  readonly entryFile: string;
  readonly implemented: boolean;
  readonly status: ToolStatus | 'uninitialized';
  readonly indexable: boolean;
  readonly sitemap: boolean;
  readonly routePath: string;
  readonly canonicalUrl: string;
  readonly title: string;
  readonly description: string;
  readonly launchOrder: number;
  readonly metadata: ToolMetadata | null;
}

export interface DiscoveredRoute {
  readonly kind: 'static' | 'tool';
  readonly slug: string;
  readonly path: string;
  readonly canonicalUrl: string;
  readonly title: string;
  readonly description: string;
  readonly indexable: boolean;
  readonly sitemap: boolean;
  readonly priority: string;
}

interface RawManifestLike {
  slug?: string;
  name?: string;
  path?: string;
  canonical?: string;
  title?: string;
  description?: string;
  keywords?: readonly string[];
  category?: ToolMetadata['category'];
  indexable?: boolean;
  sitemap?: boolean;
  status?: ToolStatus;
  launchOrder?: number;
  featured?: boolean;
  requiresConsent?: boolean;
}

function isStubFile(filePath: string): boolean {
  const content = readTextFile(filePath).trim();
  return content === '' || content === '// TODO: Implement' || content.startsWith('// TODO:');
}

async function loadPureToolMetadata(toolDir: string): Promise<RawManifestLike | null> {
  const candidates = [path.join(toolDir, 'metadata.ts'), path.join(toolDir, 'manifest.ts')];

  for (const candidate of candidates) {
    if (!fileExists(candidate) || isStubFile(candidate)) {
      continue;
    }
    const mod = (await import(pathToFileURL(candidate).href)) as {
      metadata?: RawManifestLike;
      manifest?: RawManifestLike;
      default?: RawManifestLike;
    };
    const raw = mod.metadata ?? mod.manifest ?? mod.default;
    if (raw && typeof raw === 'object') {
      return raw;
    }
  }

  return null;
}

export async function discoverToolsFromFilesystem(
  toolsRoot: string = resolveFromRoot('src', 'tools'),
): Promise<DiscoveredToolEntry[]> {
  const slugs = listSubdirectories(toolsRoot);
  const discovered: DiscoveredToolEntry[] = [];

  for (const slug of slugs) {
    const toolDir = path.join(toolsRoot, slug);
    const entryFile = path.join(toolDir, 'index.ts');

    if (!fileExists(entryFile) || isStubFile(entryFile)) {
      discovered.push({
        slug,
        directory: toolDir,
        entryFile,
        implemented: false,
        status: 'uninitialized',
        indexable: false,
        sitemap: false,
        routePath: normalizeRoutePath(`/${slug}/`),
        canonicalUrl: buildCanonicalUrl(`/${slug}/`),
        title: slug,
        description: '',
        launchOrder: Number.MAX_SAFE_INTEGER,
        metadata: null,
      });
      continue;
    }

    const raw = await loadPureToolMetadata(toolDir);
    if (!raw || !raw.title || !raw.description) {
      discovered.push({
        slug,
        directory: toolDir,
        entryFile,
        implemented: false,
        status: 'uninitialized',
        indexable: false,
        sitemap: false,
        routePath: normalizeRoutePath(`/${slug}/`),
        canonicalUrl: buildCanonicalUrl(`/${slug}/`),
        title: raw?.title ?? slug,
        description: raw?.description ?? '',
        launchOrder: raw?.launchOrder ?? Number.MAX_SAFE_INTEGER,
        metadata: null,
      });
      continue;
    }

    const rawPath = raw.canonical ?? raw.path ?? `/${slug}/`;
    const routePath = rawPath.startsWith('http')
      ? normalizeRoutePath(new URL(rawPath).pathname)
      : normalizeRoutePath(rawPath);
    const status: ToolStatus = raw.status ?? 'draft';

    const normalizedMeta: ToolMetadata = {
      slug: raw.slug ?? slug,
      name: raw.name ?? raw.title,
      title: raw.title,
      description: raw.description,
      keywords: raw.keywords ?? [],
      category: raw.category ?? 'utility',
      canonical: buildCanonicalUrl(routePath),
      status,
      indexable: Boolean(raw.indexable),
      sitemap: Boolean(raw.sitemap),
      launchOrder: raw.launchOrder ?? 999,
      featured: raw.featured,
      requiresConsent: raw.requiresConsent,
    };

    discovered.push({
      slug: normalizedMeta.slug,
      directory: toolDir,
      entryFile,
      implemented: true,
      status,
      indexable: normalizedMeta.indexable,
      sitemap: normalizedMeta.sitemap,
      routePath,
      canonicalUrl: normalizedMeta.canonical,
      title: normalizedMeta.title,
      description: normalizedMeta.description,
      launchOrder: normalizedMeta.launchOrder,
      metadata: normalizedMeta,
    });
  }

  return discovered.sort((a, b) => a.launchOrder - b.launchOrder || a.slug.localeCompare(b.slug));
}

export async function discoverPublishedRoutes(toolsRoot?: string): Promise<DiscoveredRoute[]> {
  const staticRoutes: DiscoveredRoute[] = STATIC_PAGE_ROUTES.map((page: StaticPageRouteConfig) => ({
    kind: 'static',
    slug: page.slug,
    path: normalizeRoutePath(page.path),
    canonicalUrl: buildCanonicalUrl(page.path),
    title: page.title,
    description: page.description,
    indexable: page.indexable,
    sitemap: page.sitemap,
    priority: page.priority,
  }));

  const tools = await discoverToolsFromFilesystem(toolsRoot);
  const liveToolRoutes: DiscoveredRoute[] = tools
    .filter((tool) => tool.implemented && tool.status === 'live')
    .map((tool) => ({
      kind: 'tool',
      slug: tool.slug,
      path: tool.routePath,
      canonicalUrl: tool.canonicalUrl,
      title: tool.title,
      description: tool.description,
      indexable: tool.indexable,
      sitemap: tool.sitemap,
      priority: '0.8',
    }));

  return [...staticRoutes, ...liveToolRoutes];
}
