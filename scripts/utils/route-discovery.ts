/**
 * Node-side tool discovery. Reads src/tools/<slug>/manifest.ts at
 * runtime and returns parsed manifests. Mirrors the Vite-side glob
 * discovery in src/router/route-registry.ts.
 */

import { join } from 'node:path';
import { readdir } from 'node:fs/promises';
import { pathExists, readText } from './file-system';
import { PATHS } from './constants';
import type { ToolManifest } from '../../src/config/tools';

const TOOLS_DIR = PATHS.srcTools;

/**
 * Extracts a manifest object from a manifest.ts file's source text.
 * Expects the file to export a default object literal or a const.
 * This is a deliberate regex parse; the manifest files are simple
 * and stable by convention.
 */
function parseManifestSource(source: string): ToolManifest | null {
  // Match: export const manifest: ToolManifest = { ... };
  // or:    const manifest: ToolManifest = { ... };
  // or:    export const manifest = { ... };
  const match = source.match(
    /(?:export\s+)?const\s+manifest\s*(?::\s*ToolManifest\s*)?=\s*(\{[\s\S]*?\n\};)/,
  );
  if (!match) return null;

  const objectLiteral = match[1].replace(/;\s*$/, '');

  // Convert TS object literal to JSON-compatible text.
  // Rules: keys already quoted are fine; single quotes become double.
  const normalized = objectLiteral
    .replace(/'/g, '"')
    .replace(/([a-zA-Z_$][\w$]*)\s*:/g, '"$1":')
    .replace(/,\s*}/g, '}');

  try {
    return JSON.parse(normalized) as ToolManifest;
  } catch {
    return null;
  }
}

export interface DiscoveredTool {
  slug: string;
  manifest: ToolManifest;
  filePath: string;
}

export interface DiscoveryResult {
  tools: DiscoveredTool[];
  errors: string[];
}

/**
 * Walks src/tools/, reads each <slug>/manifest.ts, and parses it.
 * Skips folders without a manifest.
 */
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
      errors.push(
        `Manifest slug "${manifest.slug}" does not match folder name "${entry.name}"`,
      );
      continue;
    }

    tools.push({ slug: entry.name, manifest, filePath: manifestPath });
  }

  return { tools, errors };
}
