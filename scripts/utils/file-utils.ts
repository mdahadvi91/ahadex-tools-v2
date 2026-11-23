/**
 * File system utility helpers for AHADEX Tools build & validation scripts.
 *
 * Input: Relative or absolute file paths within the workspace.
 * Output: Synchronous deterministic file reads/writes, directory enumeration, and JSON persistence.
 * Failure behavior: Throws descriptive Errors on missing required files or invalid JSON;
 * ensures parent directories exist before writing outputs.
 */

import fs from 'node:fs';
import path from 'node:path';

export const PROJECT_ROOT = path.resolve(process.cwd());

export function resolveFromRoot(...segments: string[]): string {
  return path.resolve(PROJECT_ROOT, ...segments);
}

export function fileExists(targetPath: string): boolean {
  return fs.existsSync(targetPath);
}

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function readTextFile(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required file not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

export function writeTextFile(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

export function readJsonFile<T>(filePath: string): T {
  const raw = readTextFile(filePath);
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse JSON at ${filePath}: ${message}`, { cause: error });
  }
}

export function writeJsonFile(filePath: string, data: unknown): void {
  writeTextFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

export function listSubdirectories(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

export function walkFiles(dirPath: string, predicate?: (filePath: string) => boolean): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  const results: string[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath, predicate));
    } else if (entry.isFile()) {
      if (!predicate || predicate(fullPath)) {
        results.push(fullPath);
      }
    }
  }
  return results.sort((a, b) => a.localeCompare(b));
}
