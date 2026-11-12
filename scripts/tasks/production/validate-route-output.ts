/**
 * Route output validator. Ensures every live tool route declared in
 * the manifest has corresponding route handling.
 *
 * In SPA mode: verifies the route is handled by the client-side router
 * (via _redirects fallback and manifest entry).
 * In SSG mode (future): verifies dist/tools/<slug>/index.html exists.
 */

import { join } from 'node:path';
import { readText, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { discoverTools } from '../../utils/route-discovery';
import { error, info, type Violation } from '../../utils/validation-result';

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const { tools } = await discoverTools();
  const liveTools = tools.filter((t) => t.manifest.status === 'live');
  if (liveTools.length === 0) {
    violations.push(info('route-no-tools', 'No live tools to validate.'));
    return violations;
  }

  // Rule 1: check dist/index.html has prerender marker.
  const indexPath = join(PATHS.dist, 'index.html');
  if (!(await pathExists(indexPath))) {
    return [
      error('route-no-dist', 'dist/index.html is missing.', {
        file: 'dist/index.html',
        hint: 'Run `npm run build` first.',
      }),
    ];
  }
  const html = await readText(indexPath);
  const isPrerendered = html.includes('data-prerender-ready="true"');

  if (isPrerendered) {
    // SSG mode: each route must have its own HTML.
    for (const tool of liveTools) {
      const routePath = tool.manifest.path.replace(/^\//, '');
      const routeHtml = join(PATHS.dist, routePath, 'index.html');
      if (!(await pathExists(routeHtml))) {
        violations.push(
          error('route-html-missing', `SSG mode active but ${routeHtml} is missing.`, {
            file: `dist/${routePath}/index.html`,
            hint: 'Run `npm run generate:prerender` after build.',
          }),
        );
      }
    }
  } else {
    // SPA mode: verify _redirects covers the route.
    const redirectsPath = join(PATHS.public, '_redirects');
    if (await pathExists(redirectsPath)) {
      const redirects = await readText(redirectsPath);
      const hasCatchAll = /\/\*\s+\/index\.html\s+200/.test(redirects);
      const hasToolsCatchAll = /\/tools\/\*\s+\/index\.html\s+200/.test(redirects);
      if (!hasCatchAll && !hasToolsCatchAll) {
        violations.push(
          error(
            'route-no-spa-fallback',
            'SPA mode active but _redirects has no catch-all for /tools/*.',
            {
              file: 'public/_redirects',
              hint: 'Add: /tools/* /index.html 200',
            },
          ),
        );
      }
    }
  }

  // Rule 2: routes.tsx must declare all live tool paths (via route registry).
  const routesPath = join(PATHS.srcRouter, 'routes.tsx');
  if (!(await pathExists(routesPath))) {
    violations.push(
      error('routes-file-missing', 'src/router/routes.tsx is missing.', {
        file: 'src/router/routes.tsx',
      }),
    );
  } else {
    const routesSrc = await readText(routesPath);
    if (!/getToolRoutes|toolRoutes/.test(routesSrc)) {
      violations.push(
        error(
          'routes-no-tool-discovery',
          'routes.tsx does not use tool discovery (toolRoutes/getToolRoutes).',
          {
            file: 'src/router/routes.tsx',
            hint: 'Import getToolRoutes() to wire tool routes automatically.',
          },
        ),
      );
    }
  }

  // Rule 3: each live tool has an index.ts entry point.
  for (const tool of liveTools) {
    const indexPath2 = join(PATHS.srcTools, tool.manifest.slug, 'index.ts');
    if (!(await pathExists(indexPath2))) {
      violations.push(
        error('tool-no-index', `Tool "${tool.manifest.slug}" has no index.ts entry point.`, {
          file: `src/tools/${tool.manifest.slug}/index.ts`,
        }),
      );
    }
  }

  violations.push(
    info(
      'route-output-ok',
      `${liveTools.length} live tools, mode: ${isPrerendered ? 'SSG' : 'SPA'}.`,
    ),
  );

  return violations;
}
