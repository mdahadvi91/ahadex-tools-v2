/**
 * Orphan pages validator. Detects routes that exist but are not
 * linked from anywhere:
 *   - Tool pages not linked from Home, Tools, Footer, or other tools
 *   - Static pages not linked from Header, Footer, or Home
 *
 * Orphan pages waste crawl budget and rarely rank.
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { discoverTools } from '../../utils/route-discovery';
import { warning, type Violation } from '../../utils/validation-result';

const STATIC_ROUTES = [
  '/',
  '/tools',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/disclaimer',
  '/cookies',
];

/** Extracts Link/href paths that appear anywhere in src. */
async function buildLinkCorpus(): Promise<string> {
  const files = await walkFiles(PATHS.src, { extensions: ['.ts', '.tsx', '.tsx'] });
  let corpus = '';
  for (const file of files) {
    const relPath = file
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');
    if (relPath.endsWith('.test.ts') || relPath.endsWith('.test.tsx')) continue;
    corpus += (await readText(file)) + '\n';
  }
  return corpus;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];
  const corpus = await buildLinkCorpus();

  // Check static routes.
  for (const path of STATIC_ROUTES) {
    if (path === '/') continue; // root is always linked
    // Look for the path in corpus.
    const pattern = new RegExp(`['"]${path.replace(/\//g, '\\/')}['"]`);
    if (!pattern.test(corpus)) {
      violations.push(
        warning('orphan-static-route', `Static route "${path}" is not linked from anywhere.`, {
          file: 'src/config/navigation.ts',
          hint: 'Add a link from Header, Footer or Home.',
        }),
      );
    }
  }

  // Check tool routes.
  const { tools } = await discoverTools();
  for (const tool of tools) {
    if (tool.manifest.status !== 'live' || !tool.manifest.indexable) continue;

    const path = tool.manifest.path;
    const pattern = new RegExp(`['"]${path.replace(/\//g, '\\/')}['"]`);
    if (!pattern.test(corpus)) {
      violations.push(
        warning('orphan-tool-route', `Tool "${tool.manifest.slug}" is not linked from anywhere.`, {
          file: tool.filePath.replace(PATHS.root + '/', ''),
          hint: 'Home and Tools pages should link to live tools.',
        }),
      );
    }
  }

  return violations;
}
