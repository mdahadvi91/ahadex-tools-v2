/**
 * Generate static HTML for every route with React SSR content and metadata.
 * Uses dynamic imports to ensure React is available in the Node.js global scope.
 */

import { join, dirname } from 'node:path';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { PATHS } from '../../utils/constants';
import { logger } from '../../utils/logger';

import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

// Polyfill for Vite's import.meta.env in Node.js
(globalThis as any).import_meta_env = {
  PROD: true,
  DEV: false,
  MODE: 'production',
  BASE_URL: '/',
  SSR: true,
};

const DIST_DIR = join(PATHS.root, 'dist');
const SPA_HTML_PATH = join(DIST_DIR, 'index.html');
const METADATA_PATH = join(DIST_DIR, 'metadata.json');

interface RouteMeta {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  ogType: string;
  jsonLd?: unknown;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHeadTags(meta: RouteMeta): string {
  const tags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`,
    `<meta property="og:type" content="${escapeHtml(meta.ogType)}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.canonical)}" />`,
    `<meta property="og:image" content="${escapeHtml(meta.ogImage)}" />`,
    `<meta property="og:site_name" content="AHADEX Tools" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(meta.ogImage)}" />`,
  ];

  if (meta.jsonLd) {
    tags.push(`<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>`);
  }

  return tags.join('\n    ');
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

export async function run(): Promise<void> {
  logger.heading('Generating static HTML (SSR) per route');

  // Set global React for JSX in Node.js
  (globalThis as any).React = React;
  (globalThis as any).import_meta = { env: (globalThis as any).import_meta_env };

  if (!(await pathExists(SPA_HTML_PATH))) {
    logger.error('dist/index.html not found. Run vite build first.');
    process.exit(1);
  }
  if (!(await pathExists(METADATA_PATH))) {
    logger.error('dist/metadata.json not found. Run generate:metadata-bundle first.');
    process.exit(1);
  }

  const spaHtml = await readFile(SPA_HTML_PATH, 'utf8');
  const metadata: Record<string, RouteMeta> = JSON.parse(await readFile(METADATA_PATH, 'utf8'));

  // Dynamically import App AFTER setting global React
  const AppModule = await import('../../../src/App');
  const App = AppModule.default;

  for (const [route, meta] of Object.entries(metadata)) {
    let appHtml = '';
    try {
      appHtml = renderToString(
        React.createElement(MemoryRouter, { initialEntries: [route] }, React.createElement(App)),
      );
    } catch (error) {
      logger.warn(`SSR failed for ${route}. Falling back to empty root. Error: ${error}`);
      appHtml = '';
    }

    let html = spaHtml.replace(/<title>[^<]*<\/title>/, '');
    html = html.replace(/(<meta name="viewport"[^>]*\/>)/, `$1\n    ${buildHeadTags(meta)}`);
    html = html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

    const outputDir = route === '/' ? DIST_DIR : join(DIST_DIR, route.slice(1));
    const outputPath = join(outputDir, 'index.html');

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, html, 'utf8');
    logger.success(`html: ${route}/index.html`);
  }

  logger.success(`${Object.keys(metadata).length} static HTML file(s) generated.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((err) => {
    logger.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
