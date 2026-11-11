/**
 * Import boundary validator. Enforces layer boundaries:
 *   - src/tools/* may import from src/platform, src/config, src/components/ui
 *   - src/platform may import from src/config only (not from src/tools,
 *     src/components, src/pages, src/router)
 *   - src/components (shared) may import from src/config and platform
 *     utilities only, never from src/tools
 *   - src/pages may import from src/tools, src/components, src/config,
 *     src/platform
 *   - scripts/** may import from src/config and src/platform only
 *
 * Any violation blocks the build.
 */

import { relative } from 'node:path';
import { readText, walkFiles } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, type Violation } from '../../utils/validation-result';

type Layer =
  'tools' | 'components' | 'pages' | 'router' | 'config' | 'platform' | 'scripts' | 'other';

interface LayerRule {
  allowed: ReadonlySet<Layer>;
  forbidden: ReadonlySet<Layer>;
  reason: string;
}

/** Resolves a file path to its layer. */
function layerOf(relPath: string): Layer {
  if (relPath.startsWith('src/tools/')) return 'tools';
  if (relPath.startsWith('src/components/')) return 'components';
  if (relPath.startsWith('src/pages/')) return 'pages';
  if (relPath.startsWith('src/router/')) return 'router';
  if (relPath.startsWith('src/config/')) return 'config';
  if (relPath.startsWith('src/platform/')) return 'platform';
  if (relPath.startsWith('scripts/')) return 'scripts';
  if (relPath.startsWith('src/')) return 'other';
  return 'other';
}

const RULES: Record<Layer, LayerRule> = {
  tools: {
    allowed: new Set<Layer>(['tools', 'platform', 'config', 'components', 'other']),
    forbidden: new Set<Layer>(['pages', 'router', 'scripts']),
    reason: 'Tools must not depend on pages, router, or scripts.',
  },
  components: {
    allowed: new Set<Layer>(['components', 'config', 'platform', 'other']),
    forbidden: new Set<Layer>(['tools', 'pages', 'router', 'scripts']),
    reason: 'Shared components must not depend on tools, pages, router, or scripts.',
  },
  pages: {
    allowed: new Set<Layer>([
      'pages',
      'components',
      'tools',
      'config',
      'platform',
      'router',
      'other',
    ]),
    forbidden: new Set<Layer>(['scripts']),
    reason: 'Pages must not depend on scripts.',
  },
  router: {
    allowed: new Set<Layer>(['router', 'pages', 'tools', 'config', 'components', 'other']),
    forbidden: new Set<Layer>(['platform', 'scripts']),
    reason: 'Router must not depend on platform internals or scripts.',
  },
  config: {
    allowed: new Set<Layer>(['config', 'other']),
    forbidden: new Set<Layer>(['tools', 'components', 'pages', 'router', 'platform', 'scripts']),
    reason: 'Config must be dependency-free.',
  },
  platform: {
    allowed: new Set<Layer>(['platform', 'config', 'other']),
    forbidden: new Set<Layer>(['tools', 'components', 'pages', 'router', 'scripts']),
    reason: 'Platform must not depend on UI, tools, pages, router, or scripts.',
  },
  scripts: {
    allowed: new Set<Layer>(['scripts', 'config', 'platform', 'other']),
    forbidden: new Set<Layer>(['tools', 'components', 'pages', 'router']),
    reason: 'Scripts must not depend on UI, tools, pages, or router.',
  },
  other: {
    allowed: new Set<Layer>([
      'other',
      'config',
      'platform',
      'components',
      'pages',
      'router',
      'tools',
    ]),
    forbidden: new Set<Layer>(['scripts']),
    reason: 'Other src files must not depend on scripts.',
  },
};

interface ImportSpec {
  specifier: string;
  line: number;
}

/**
 * Extracts static and dynamic import specifiers from a source file.
 * Matches:
 *   import ... from 'spec'
 *   import 'spec'
 *   export ... from 'spec'
 *   import('spec')
 *   require('spec')
 */
/** Strips line and block comments before scanning for imports. */
function stripComments(source: string): string {
  let out = '';
  let i = 0;
  let inString: string | null = null;
  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];
    if (inString !== null) {
      out += c;
      if (c === '\\' && i + 1 < source.length) {
        out += source[i + 1];
        i += 2;
        continue;
      }
      if (c === inString) inString = null;
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      inString = c;
      out += c;
      i++;
      continue;
    }
    if (c === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && next === '*') {
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

function extractImports(source: string): ImportSpec[] {
  const clean = stripComments(source);
  const imports: ImportSpec[] = [];
  const patterns: RegExp[] = [
    /\bimport\s+(?:type\s+)?[^'"]*?from\s+['"]([^'"]+)['"]/g,
    /\bimport\s+['"]([^'"]+)['"]/g,
    /\bexport\s+(?:type\s+)?[^'"]*?from\s+['"]([^'"]+)['"]/g,
    /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const re of patterns) {
    let match: RegExpExecArray | null;
    while ((match = re.exec(source)) !== null) {
      imports.push({ specifier: match[1], line: lineNumberAt(clean, match.index) });
      if (match.index === re.lastIndex) re.lastIndex += 1;
    }
  }
  return imports;
}

function lineNumberAt(source: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

/**
 * Resolves an import specifier to a project-relative path. Returns
 * null for node_modules or external URLs.
 */
function resolveImport(specifier: string, fromFile: string): string | null {
  // Ignore bare specifiers (node_modules).
  if (!specifier.startsWith('.') && !specifier.startsWith('/') && !specifier.startsWith('@/')) {
    return null;
  }

  let absPath: string;
  if (specifier.startsWith('@/')) {
    absPath = `${PATHS.src}/${specifier.slice(2)}`;
  } else if (specifier.startsWith('/')) {
    absPath = `${PATHS.root}${specifier}`;
  } else {
    // Relative: resolve from the importing file's directory.
    const fromDir = fromFile.substring(0, fromFile.lastIndexOf('/'));
    absPath = resolvePath(fromDir, specifier);
  }

  const rel = relative(PATHS.root, absPath).split('\\').join('/');
  return rel;
}

/** Simple POSIX-style path resolver for imports. */
function resolvePath(baseDir: string, relativePath: string): string {
  const baseParts = baseDir.split('/').filter(Boolean);
  const relParts = relativePath.split('/');
  for (const part of relParts) {
    if (part === '..') baseParts.pop();
    else if (part !== '.') baseParts.push(part);
  }
  // Strip extension indicators for layer comparison.
  let result = '/' + baseParts.join('/');
  if (result.endsWith('.tsx')) result = result.slice(0, -4);
  else if (result.endsWith('.ts')) result = result.slice(0, -3);
  return result;
}

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'coverage', '.vite', 'reports']);

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const files = await walkFiles(PATHS.root, {
    extensions: ['.ts', '.tsx'],
    skipDirs: Array.from(SKIP_DIRS),
  });

  for (const file of files) {
    const relPath = relative(PATHS.root, file).split('\\').join('/');
    if (!relPath.startsWith('src/') && !relPath.startsWith('scripts/')) continue;
    if (relPath.endsWith('.test.ts') || relPath.endsWith('.test.tsx')) continue;

    const source = await readText(file);
    const imports = extractImports(source);
    const fromLayer = layerOf(relPath);
    const rule = RULES[fromLayer];

    for (const imp of imports) {
      const target = resolveImport(imp.specifier, `/${relPath}`);
      if (target === null) continue;
      const toLayer = layerOf(target);
      if (toLayer === fromLayer) continue;
      if (toLayer === 'other') continue;

      if (rule.forbidden.has(toLayer)) {
        violations.push(
          error(
            'forbidden-import',
            `Import from "${fromLayer}" into "${toLayer}" is forbidden: ${imp.specifier}`,
            {
              file: relPath,
              line: imp.line,
              hint: rule.reason,
            },
          ),
        );
      }
    }
  }

  return violations;
}
