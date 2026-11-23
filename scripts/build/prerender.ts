import fs from 'node:fs';
import path from 'node:path';
import { render } from '../../src/app/entry-server';
import { toolRoutes } from '../../src/router/route-registry';
import { assertValidEnvironment, getEnvironment } from '../../src/config/environment';

assertValidEnvironment();
const env = getEnvironment();

const distDir = path.resolve('dist');
const templatePath = path.join(distDir, 'index.html');

if (!fs.existsSync(templatePath)) {
  throw new Error(`Missing built template at ${templatePath}. Run build:client first.`);
}

const template = fs.readFileSync(templatePath, 'utf8');
const routesToRender = [
  {
    path: '/',
    title: 'AHADEX Tools - Fast, Private Browser Utilities',
    description: '100% browser-based image and PDF tools. Your files stay on your device.',
  },
  ...toolRoutes.map((r) => ({
    path: r.path,
    title: r.meta.title,
    description: r.meta.description,
  })),
];

for (const route of routesToRender) {
  const appHtml = render(route.path);
  let html = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
  html = html.replace(/<title>.*?<\/title>/s, `<title>${route.title}</title>`);

  const targetDir =
    route.path === '/'
      ? distDir
      : path.join(distDir, route.path.replace(/^\/+/, ''));
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf8');
}

const llmsLines = [
  '# AHADEX Tools',
  '',
  '> Privacy-first, 100% browser-based utilities. Files are processed locally in the browser without uploading to external servers.',
  '',
  `- Site: ${env.siteUrl}`,
  '',
  '## Available Tools',
  ...toolRoutes.map(
    (r) => `- [${r.meta.title}](${env.siteUrl}${r.path}): ${r.meta.description}`,
  ),
  '',
];

const llmsContent = llmsLines.join('\n');
fs.writeFileSync(path.resolve('public/llms.txt'), llmsContent, 'utf8');
fs.writeFileSync(path.join(distDir, 'llms.txt'), llmsContent, 'utf8');
console.log(`Prerendered ${routesToRender.length} routes and generated llms.txt.`);
