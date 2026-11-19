import { join } from 'node:path';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { PATHS } from '../../utils/constants';
import { logger } from '../../utils/logger';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

const DIST_DIR = join(PATHS.root, 'dist');
const SPA_HTML_PATH = join(DIST_DIR, 'index.html');
const METADATA_PATH = join(DIST_DIR, 'metadata.json');

interface RouteMeta {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  ogType: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export async function run(): Promise<void> {
  logger.heading('Generating static HTML (SSR) per route');
  (globalThis as unknown as { React: typeof React }).React = React;

  const spaHtml = await readFile(SPA_HTML_PATH, 'utf8');
  const metadata = JSON.parse(await readFile(METADATA_PATH, 'utf8')) as Record<string, RouteMeta>;

  const AppModule = await import('../../../src/App');
  const App = AppModule.default;

  for (const [route, meta] of Object.entries(metadata)) {
    let appHtml = '';
    try {
      appHtml = renderToString(
        React.createElement(MemoryRouter, { initialEntries: [route] }, React.createElement(App)),
      );
    } catch (error) {
      logger.warn(`SSR failed for ${route}. Error: ${error}`);
    }

    const html = spaHtml
      .replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`)
      .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

    const outputDir = route === '/' ? DIST_DIR : join(DIST_DIR, route.slice(1));
    const outputPath = join(outputDir, 'index.html');
    await mkdir(outputDir, { recursive: true });
    await writeFile(outputPath, html, 'utf8');
    logger.success(`html: ${route}/index.html`);
  }
}
