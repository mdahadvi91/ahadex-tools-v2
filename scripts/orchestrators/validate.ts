import fs from 'node:fs';
import path from 'node:path';
import { assertValidEnvironment } from '../../src/config/environment';
import { toolRoutes } from '../../src/router/route-registry';

const phaseArg = process.argv.find((a) => a.startsWith('--phase='))?.split('=')[1] ?? 'all';

assertValidEnvironment();

if (phaseArg === 'pre' || phaseArg === 'all') {
  if (toolRoutes.length === 0) {
    throw new Error('No live tools registered in route-registry.ts');
  }
}

if (phaseArg === 'post' || phaseArg === 'all') {
  const requiredDistFiles = ['index.html', 'llms.txt'];
  for (const file of requiredDistFiles) {
    const fullPath = path.resolve('dist', file);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Missing expected build artifact: ${fullPath}`);
    }
  }
  const sitemapPath = path.resolve('public/sitemap.xml');
  if (!fs.existsSync(sitemapPath)) {
    throw new Error(`Missing expected sitemap artifact: ${sitemapPath}`);
  }
}

console.log(`Validation passed for phase: ${phaseArg}`);
