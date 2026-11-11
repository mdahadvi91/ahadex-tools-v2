/**
 * Node-side tool discovery. Reads src/tools/<slug>/manifest.ts at
 * runtime and returns parsed manifests. Mirrors the Vite-side glob
 * discovery in src/router/route-registry.ts.
 *
 * Note: ToolManifest is intentionally duplicated here, not imported
 * from src/config/tools.ts, to keep this script inside the Node
 * tsconfig project. The two must stay in sync; the planned
 * scripts/tasks/architecture/validate-registry-integrity.ts will
 * verify equality.
 */

import { join } from 'node:path';
import { readdir } from 'node:fs/promises';
import { pathExists, readText } from './file-system';
import { PATHS } from './constants';

export type ToolStatus = 'draft' | 'live' | 'deprecated';

export interface ToolManifestShape {
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

const TOOLS_DIR = PATHS.srcTools;

function parseManifestSource(source: string): ToolManifestShape | null {
  const match = source.match(
    /(?:export\s+)?const\s+manifest\s*(?::\s*ToolManifest\s*)?=\s*(\{[\s\S]*?\n\};)/,
  );
  if (!match) return null;

  const objectLiteral = match[1].replace(/;\s*$/, '');
  const normalized = objectLiteral
    .replace(/'/g, '"')
    .replace(/([a-zA-Z_$][\w$]*)\s*:/g, '"$1":')
    .replace(/,\s*}/g, '}');

  try {
    return JSON.parse(normalized) as ToolManifestShape;
  } catch {
    return null;
  }
}

export interface DiscoveredTool {
  slug: string;
  manifest: ToolManifestShape;
  filePath: string;
}

export interface DiscoveryResult {
  tools: DiscoveredTool[];
  errors: string[];
}

export async function discoverTools(): Promise<DiscoveryResult> {
  const errors: string[] = [];
  const tools: DiscoveredTool[] = [];

  if (!(await pathExists(TOOLS_DIR))) {
    return { tools, errors };
  }

  const entries = await readdir(TOOLS_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = join(TOOLS_DIR, entry.name, 'manifest.ts');
    if (!(await pathExists(manifestPath))) continue;

    let source: string;
    try {
      source = await readText(manifestPath);
    } catch (err) {
      errors.push(
        `Failed to read ${manifestPath}: ${err instanceof Error ? err.message : String(err)}`,
      );
      continue;
    }

    const manifest = parseManifestSource(source);
    if (!manifest) {
      errors.push(`Could not parse manifest at ${manifestPath}`);
      continue;
    }
    if (manifest.slug !== entry.name) {
      errors.push(`Manifest slug "${manifest.slug}" does not match folder name "${entry.name}"`);
      continue;
    }

    tools.push({ slug: entry.name, manifest, filePath: manifestPath });
  }

  return { tools, errors };
}
