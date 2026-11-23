import fs from 'node:fs';
import path from 'node:path';
import { assertValidEnvironment, getEnvironment } from '../../src/config/environment';

assertValidEnvironment();
const env = getEnvironment();
const distDir = path.resolve('dist');
fs.mkdirSync(distDir, { recursive: true });

const manifest = {
  siteUrl: env.siteUrl,
  generatedAt: new Date().toISOString(),
  mode: env.isProduction ? 'production' : 'development',
};

fs.writeFileSync(
  path.join(distDir, 'deployment-meta.json'),
  JSON.stringify(manifest, null, 2),
  'utf8',
);
console.log(`Wrote ${path.join(distDir, 'deployment-meta.json')}`);
