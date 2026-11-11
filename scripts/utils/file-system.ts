/**
 * Filesystem helpers used by validators and generators.
 * All reads are async and use UTF-8 unless binary is requested.
 */

import { access, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { PROJECT_ROOT } from './constants';

export async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function readText(path: string): Promise<string> {
  return readFile(path, 'utf8');
}

export async function readJson<T>(path: string): Promise<T> {
  const raw = await readText(path);
  return JSON.parse(raw) as T;
}

export async function writeText(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf8');
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  await writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

export interface WalkOptions {
  extensions?: readonly string[];
  skipDirs?: readonly string[];
  maxDepth?: number;
}

const DEFAULT_SKIP = ['node_modules', '.git', 'dist', 'coverage', '.vite'];

export async function walkFiles(root: string, options: WalkOptions = {}): Promise<string[]> {
  const skip = new Set(options.skipDirs ?? DEFAULT_SKIP);
  const extensions = options.extensions;
  const maxDepth = options.maxDepth ?? 20;
  const results: string[] = [];

  async function recurse(dir: string, depth: number): Promise<void> {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (skip.has(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        await recurse(full, depth + 1);
      } else if (entry.isFile()) {
        if (extensions && !extensions.some((ext) => entry.name.endsWith(ext))) {
          continue;
        }
        results.push(full);
      }
    }
  }

  await recurse(root, 0);
  results.sort();
  return results;
}

export async function fileSize(path: string): Promise<number> {
  const info = await stat(path);
  return info.size;
}

export function relativeToRoot(path: string): string {
  return relative(PROJECT_ROOT, path).split(sep).join('/');
}

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}
