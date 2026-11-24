import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import type { ToolManifest } from '../../src/config/tools';

interface ManifestModule {
  manifest?: unknown;
  default?: unknown;
}

const TOOLS_DIRECTORY = fileURLToPath(new URL('../../src/tools/', import.meta.url));

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isToolManifest(value: unknown): value is ToolManifest {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const manifest = value as Record<string, unknown>;

  return (
    typeof manifest.slug === 'string' &&
    SLUG_PATTERN.test(manifest.slug) &&
    typeof manifest.path === 'string' &&
    manifest.path === `/tools/${manifest.slug}` &&
    typeof manifest.title === 'string' &&
    manifest.title.trim().length > 0 &&
    typeof manifest.description === 'string' &&
    manifest.description.trim().length > 0 &&
    typeof manifest.indexable === 'boolean' &&
    typeof manifest.sitemap === 'boolean' &&
    ['draft', 'live', 'deprecated'].includes(manifest.status as string) &&
    typeof manifest.launchOrder === 'number' &&
    Number.isInteger(manifest.launchOrder) &&
    manifest.launchOrder >= 0 &&
    typeof manifest.requiresConsent === 'boolean'
  );
}

export async function discoverToolManifests(): Promise<ToolManifest[]> {
  if (!fs.existsSync(TOOLS_DIRECTORY)) {
    throw new Error(`Tools directory not found: ${TOOLS_DIRECTORY}`);
  }

  const directories = fs
    .readdirSync(TOOLS_DIRECTORY, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const manifests: ToolManifest[] = [];

  for (const directory of directories) {
    const manifestPath = path.join(TOOLS_DIRECTORY, directory, 'manifest.ts');

    if (!fs.existsSync(manifestPath)) {
      continue;
    }

    const moduleUrl = pathToFileURL(manifestPath).href;

    let module: ManifestModule;

    try {
      module = (await import(moduleUrl)) as ManifestModule;
    } catch (error) {
      throw new Error(`Failed to load manifest for "${directory}"`, { cause: error });
    }

    const manifest = module.manifest ?? module.default;

    if (!isToolManifest(manifest)) {
      throw new Error(`Invalid tool manifest: ${manifestPath}`);
    }

    if (manifest.slug !== directory) {
      throw new Error(
        `Tool directory "${directory}" does not match manifest slug "${manifest.slug}".`,
      );
    }

    if (manifest.status === 'live') {
      manifests.push(manifest);
    }
  }

  const slugs = new Set<string>();
  const paths = new Set<string>();
  const launchOrders = new Set<number>();

  for (const manifest of manifests) {
    if (slugs.has(manifest.slug)) {
      throw new Error(`Duplicate tool slug: ${manifest.slug}`);
    }

    if (paths.has(manifest.path)) {
      throw new Error(`Duplicate tool path: ${manifest.path}`);
    }

    if (launchOrders.has(manifest.launchOrder)) {
      throw new Error(`Duplicate launchOrder: ${manifest.launchOrder}`);
    }

    slugs.add(manifest.slug);
    paths.add(manifest.path);
    launchOrders.add(manifest.launchOrder);
  }

  return manifests.sort((a, b) => a.launchOrder - b.launchOrder);
}
