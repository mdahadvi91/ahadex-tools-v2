/**
 * Route ownership validator. Enforces that every route has exactly
 * one owner and no route is duplicated:
 *   - Static routes (src/pages) and tool routes (src/tools) must not
 *     collide on paths.
 *   - Each tool manifest path must be unique.
 *   - Each page file must be referenced by exactly one static route,
 *     or be a nested route component.
 */

import { readText, walkFiles, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { discoverTools } from '../../utils/route-discovery';
import { error, warning, type Violation } from '../../utils/validation-result';

/** Paths declared as static routes in src/router/routes.tsx. */
const STATIC_PATHS = [
  '/',
  '/tools',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/disclaimer',
  '/cookies',
  '*',
];

/** Pages that must exist for the static paths above (excluding catch-all). */
const EXPECTED_PAGE_COMPONENTS = [
  'Home',
  'Tools',
  'About',
  'Contact',
  'PrivacyPolicy',
  'Terms',
  'Disclaimer',
  'CookiePolicy',
  'NotFound',
];

function extractRoutesFromRoutesFile(source: string): string[] {
  const paths: string[] = [];
  const re = /path:\s*['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) {
    paths.push(match[1]);
  }
  return paths;
}

function extractImportedPages(source: string): string[] {
  const pages: string[] = [];
  const re = /import\s+(\w+)\s+from\s+['"]\.\.\/pages\/([\w]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) {
    pages.push(match[2]);
  }
  return pages;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const routesFile = `${PATHS.srcRouter}/routes.tsx`;
  if (!(await pathExists(routesFile))) {
    return [
      error('routes-file-missing', 'src/router/routes.tsx is missing.', {
        file: 'src/router/routes.tsx',
      }),
    ];
  }

  const routesSource = await readText(routesFile);
  const declaredPaths = extractRoutesFromRoutesFile(routesSource);
  const importedPages = extractImportedPages(routesSource);

  // Rule 1: page components must exist.
  if (await pathExists(PATHS.srcPages)) {
    const pageFiles = await walkFiles(PATHS.srcPages, { extensions: ['.tsx'] });
    const pageBasenames = new Set(
      pageFiles.map((f) => f.split('/').pop()?.replace('.tsx', '') ?? ''),
    );
    for (const expected of EXPECTED_PAGE_COMPONENTS) {
      if (!pageBasenames.has(expected)) {
        violations.push(
          error('page-missing', `Expected page component "${expected}.tsx" is missing.`, {
            file: `src/pages/${expected}.tsx`,
          }),
        );
      }
    }
  }

  // Rule 2: routes must import their page components.
  for (const page of EXPECTED_PAGE_COMPONENTS) {
    if (!importedPages.includes(page)) {
      violations.push(
        error('route-not-wired', `Page "${page}" is not imported by routes.tsx.`, {
          file: 'src/router/routes.tsx',
          hint: `Add: import ${page} from '../pages/${page}';`,
        }),
      );
    }
  }

  // Rule 3: static paths must all be present in routes.tsx.
  for (const path of STATIC_PATHS) {
    if (!declaredPaths.includes(path)) {
      violations.push(
        warning('static-route-missing', `Static route "${path}" is not declared in routes.tsx.`, {
          file: 'src/router/routes.tsx',
        }),
      );
    }
  }

  // Rule 4: tool paths must not collide with static paths or with each other.
  const { tools } = await discoverTools();
  const toolPaths = tools.map((t) => t.manifest.path);
  const toolSlugs = tools.map((t) => t.manifest.slug);

  for (const tool of tools) {
    if (STATIC_PATHS.includes(tool.manifest.path)) {
      violations.push(
        error(
          'tool-static-collision',
          `Tool "${tool.manifest.slug}" uses path "${tool.manifest.path}" which collides with a static route.`,
          {
            file: tool.filePath.replace(PATHS.root + '/', ''),
          },
        ),
      );
    }
  }

  const pathCounts = new Map<string, number>();
  for (const p of toolPaths) {
    pathCounts.set(p, (pathCounts.get(p) ?? 0) + 1);
  }
  for (const [p, count] of pathCounts) {
    if (count > 1) {
      violations.push(
        error('duplicate-tool-path', `Path "${p}" is used by ${count} tools.`, {
          hint: 'Each tool must have a unique path.',
        }),
      );
    }
  }

  const slugCounts = new Map<string, number>();
  for (const s of toolSlugs) {
    slugCounts.set(s, (slugCounts.get(s) ?? 0) + 1);
  }
  for (const [s, count] of slugCounts) {
    if (count > 1) {
      violations.push(error('duplicate-tool-slug', `Slug "${s}" is used by ${count} tools.`));
    }
  }

  return violations;
}
