/**
 * Registry integrity validator. Ensures the task registry
 * (scripts/registry/tasks.ts) is in sync with the files on disk:
 *   - Every task file in scripts/tasks/<group>/ must be imported
 *     and registered in tasks.ts.
 *   - Every import in tasks.ts must point to an existing file.
 *   - Group names in the registry must match directory names.
 *   - No task file may exist without being registered (prevents
 *     dead code and forgotten validators).
 */

import { join, relative } from 'node:path';
import { readdir } from 'node:fs/promises';
import { readText, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

const TASKS_TS = join(PATHS.scripts, 'registry/tasks.ts');
const TASKS_DIR = join(PATHS.scripts, 'tasks');

interface RegistryImport {
  group: string;
  module: string;
  path: string;
  line: number;
}

function lineNumberAt(source: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

function extractImports(source: string): RegistryImport[] {
  const out: RegistryImport[] = [];
  const re = /from\s+['"](\.\.\/tasks\/([^/]+)\/([^'"]+))['"]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) {
    out.push({
      path: match[1],
      group: match[2],
      module: match[3],
      line: lineNumberAt(source, match.index),
    });
  }
  return out;
}

async function listTaskFiles(): Promise<Array<{ group: string; file: string; path: string }>> {
  const out: Array<{ group: string; file: string; path: string }> = [];
  const groups = await readdir(TASKS_DIR, { withFileTypes: true });
  for (const group of groups) {
    if (!group.isDirectory()) continue;
    const groupPath = join(TASKS_DIR, group.name);
    const files = await readdir(groupPath, { withFileTypes: true });
    for (const file of files) {
      if (!file.isFile() || !file.name.endsWith('.ts')) continue;
      out.push({
        group: group.name,
        file: file.name,
        path: join(groupPath, file.name),
      });
    }
  }
  return out;
}

/**
 * Extracts the set of module names that appear in the registry's
 * tasks arrays (via the imported `*Run` identifiers). We match
 * against the import aliases in tasks.ts.
 */
function extractRegisteredModules(source: string): Set<string> {
  const registered = new Set<string>();
  // Capture all `run: someAlias` entries and map back to imports.
  const importMap = new Map<string, string>();
  const importRe =
    /import\s+\{\s*run\s+as\s+(\w+)\s*\}\s+from\s+['"]\.\.\/tasks\/([^/]+)\/([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = importRe.exec(source)) !== null) {
    importMap.set(m[1], `${m[2]}/${m[3]}`);
  }
  // Now find every `run: <alias>` usage.
  const useRe = /run:\s*(\w+)/g;
  while ((m = useRe.exec(source)) !== null) {
    const target = importMap.get(m[1]);
    if (target) registered.add(target);
  }
  return registered;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  if (!(await pathExists(TASKS_TS))) {
    return [
      error('registry-missing', 'scripts/registry/tasks.ts is missing.', {
        file: 'scripts/registry/tasks.ts',
      }),
    ];
  }

  if (!(await pathExists(TASKS_DIR))) {
    return [
      error('tasks-dir-missing', 'scripts/tasks/ directory is missing.', {
        file: 'scripts/tasks/',
      }),
    ];
  }

  const registrySource = await readText(TASKS_TS);
  const imports = extractImports(registrySource);
  const registeredModules = extractRegisteredModules(registrySource);
  const taskFiles = await listTaskFiles();

  // Rule 1: every import must point to an existing file.
  for (const imp of imports) {
    const expectedPath = join(PATHS.scripts, 'tasks', imp.group, `${imp.module}.ts`);
    if (!(await pathExists(expectedPath))) {
      violations.push(
        error(
          'registry-import-missing',
          `Registry imports missing file: ${imp.path}`,
          { file: 'scripts/registry/tasks.ts', line: imp.line },
        ),
      );
    }
  }

  // Rule 2: every task file on disk must be imported AND registered.
  const importedModuleKeys = new Set(imports.map((i) => `${i.group}/${i.module}`));

  for (const taskFile of taskFiles) {
    const moduleName = taskFile.file.replace(/\.ts$/, '');
    const key = `${taskFile.group}/${moduleName}`;

    if (!importedModuleKeys.has(key)) {
      violations.push(
        error(
          'task-not-imported',
          `Task file exists but is not imported by tasks.ts: ${key}.`,
          {
            file: relative(PATHS.root, taskFile.path).split('\\').join('/'),
            hint: 'Add the import and register the task, or remove the file.',
          },
        ),
      );
      continue;
    }

    if (!registeredModules.has(key)) {
      violations.push(
        error(
          'task-not-registered',
          `Task is imported but not registered in a group: ${key}.`,
          {
            file: 'scripts/registry/tasks.ts',
            hint: 'Add the task to its group in TASKS.',
          },
        ),
      );
    }
  }

  // Rule 3: every registered module must exist on disk (reverse check).
  const diskKeys = new Set(taskFiles.map((t) => `${t.group}/${t.file.replace(/\.ts$/, '')}`));
  for (const registered of registeredModules) {
    if (!diskKeys.has(registered)) {
      violations.push(
        error(
          'registered-task-missing',
          `Task is registered but file is missing: ${registered}.`,
          { file: 'scripts/registry/tasks.ts' },
        ),
      );
    }
  }

  // Rule 4: warn if any group directory is empty.
  const groupDirs = await readdir(TASKS_DIR, { withFileTypes: true });
  for (const group of groupDirs) {
    if (!group.isDirectory()) continue;
    const groupFiles = taskFiles.filter((t) => t.group === group.name);
    if (groupFiles.length === 0) {
      violations.push(
        warning(
          'empty-group',
          `Group "${group.name}" has no task files.`,
          { file: `scripts/tasks/${group.name}/` },
        ),
      );
    }
  }

  return violations;
}
