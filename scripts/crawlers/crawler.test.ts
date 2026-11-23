import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { SITE_CONFIG } from '../../config/site.config';
import {
  extractHtmlSignals,
  isAllowedByRobots,
  parseRobotsTxt,
  runCrawlerSimulation,
} from './simulate-crawlers';
import { discoverPublishedRoutes } from '../utils/route-discovery';

const tempDirs: string[] = [];

function createTempDir(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

function buildValidHtmlPage(options: {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  ogImage: string;
  h1: string;
  linksHtml?: string;
  extraWords?: number;
  withJsonLd?: boolean;
}): string {
  const filler = Array.from({ length: options.extraWords ?? 165 }, (_, i) => `word${i + 1}`).join(
    ' ',
  );
  const jsonLd = options.withJsonLd
    ? `<script type="application/ld+json">${JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        url: options.canonical,
      })}</script>`
    : '';

  return `<!doctype html>
<html lang="en" data-prerender-ready="true">
  <head>
    <link rel="icon" type="image/svg+xml" href="/logo.svg" />
    <title>${options.title}</title>
    <meta name="description" content="${options.description}" />
    <meta name="robots" content="${options.robots}" />
    <link rel="canonical" href="${options.canonical}" />
    <meta property="og:title" content="${options.title}" />
    <meta property="og:description" content="${options.description}" />
    <meta property="og:url" content="${options.canonical}" />
    <meta property="og:image" content="${options.ogImage}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${options.title}" />
    <meta name="twitter:image" content="${options.ogImage}" />
  </head>
  <body>
    <div id="root">
      <main>
        ${jsonLd}
        <h1>${options.h1}</h1>
        <p>${filler}</p>
        ${options.linksHtml ?? '<a href="/">Home</a>'}
      </main>
    </div>
  </body>
</html>`;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('Phase 8 robots.txt and HTML signal extraction', () => {
  it('parses crawler allowances accurately with wildcard fallback and /404.html disallow', () => {
    const parsed = parseRobotsTxt(`
User-agent: *
Allow: /
Disallow: /404.html

User-agent: Googlebot
Allow: /
Disallow: /404.html

User-agent: PerplexityBot
Allow: /
Disallow: /404.html

Sitemap: https://ahadex.online/sitemap.xml
`);

    expect(parsed.sitemaps).toEqual(['https://ahadex.online/sitemap.xml']);
    expect(isAllowedByRobots(parsed, 'Googlebot', '/pdf-compressor/')).toBe(true);
    expect(isAllowedByRobots(parsed, 'PerplexityBot', '/')).toBe(true);
    expect(isAllowedByRobots(parsed, 'GPTBot', '/image-compressor/')).toBe(true);
    expect(isAllowedByRobots(parsed, 'GPTBot', '/404.html')).toBe(false);
    expect(isAllowedByRobots(parsed, 'Googlebot', '/404.html')).toBe(false);
  });

  it('extracts head tags, JSON-LD errors, visible word count, and localhost leaks cleanly', () => {
    const badHtml = `<!doctype html>
<html lang="en" data-prerender-ready="true">
  <head>
    <title>Test Tool</title>
    <meta name="description" content="Sample description" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="http://localhost:3000/bad/" />
  </head>
  <body>
    <div id="root"><script type="application/ld+json">{invalid json}</script><h1>Tool</h1><a href="/about/">About</a></div>
  </body>
</html>`;

    const signals = extractHtmlSignals(badHtml);
    expect(signals.prerenderReady).toBe(true);
    expect(signals.rootPopulated).toBe(true);
    expect(signals.title).toBe('Test Tool');
    expect(signals.hasLocalhostLeak).toBe(true);
    expect(signals.jsonLdErrors.length).toBe(1);
    expect(signals.internalLinks).toEqual(['/about/']);
    expect(signals.visibleWordCount).toBe(2);
  });
});

describe('Phase 8 local HTTP crawler simulation end-to-end', () => {
  it('crawls all published routes across all 8 crawler profiles and catches broken internal links on defect injection', async () => {
    const fixtureDist = createTempDir('ahadex-crawler-dist-');
    const routes = await discoverPublishedRoutes();
    const tinyPng = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    fs.mkdirSync(path.join(fixtureDist, 'og'), { recursive: true });
    fs.writeFileSync(path.join(fixtureDist, 'og', 'default.png'), tinyPng);
    fs.writeFileSync(path.join(fixtureDist, 'logo.svg'), '<svg />', 'utf8');

    fs.writeFileSync(
      path.join(fixtureDist, 'robots.txt'),
      `User-agent: *\nAllow: /\nDisallow: /404.html\n\nSitemap: ${SITE_CONFIG.origin}/sitemap.xml\n`,
      'utf8',
    );

    const sitemapRoutes = routes.filter((r) => r.indexable && r.sitemap);
    fs.writeFileSync(
      path.join(fixtureDist, 'sitemap.xml'),
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapRoutes
        .map((r) => `  <url><loc>${r.canonicalUrl}</loc></url>`)
        .join('\n')}\n</urlset>\n`,
      'utf8',
    );

    const llmsLines = routes
      .filter((r) => r.kind === 'tool')
      .map((r) => `- [${r.title}](${r.canonicalUrl}): ${r.description}`);
    fs.writeFileSync(
      path.join(fixtureDist, 'llms.txt'),
      `# ${SITE_CONFIG.name}\n- ${SITE_CONFIG.origin}/\n${llmsLines.join('\n')}\n`,
      'utf8',
    );

    for (const route of routes) {
      const outPath =
        route.path === '/'
          ? path.join(fixtureDist, 'index.html')
          : path.join(fixtureDist, route.path.replace(/^\/+|\/+$/g, ''), 'index.html');
      fs.mkdirSync(path.dirname(outPath), { recursive: true });

      const ogImage =
        route.kind === 'tool'
          ? `${SITE_CONFIG.origin}/og/${route.slug}.png`
          : `${SITE_CONFIG.origin}/og/default.png`;
      if (route.kind === 'tool') {
        fs.writeFileSync(path.join(fixtureDist, 'og', `${route.slug}.png`), tinyPng);
      }

      fs.writeFileSync(
        outPath,
        buildValidHtmlPage({
          title: route.title,
          description: route.description,
          canonical: route.canonicalUrl,
          robots: route.indexable ? 'index, follow' : 'noindex, follow',
          ogImage,
          h1: route.title,
          withJsonLd: route.kind === 'tool',
        }),
        'utf8',
      );
    }

    fs.writeFileSync(
      path.join(fixtureDist, '404.html'),
      buildValidHtmlPage({
        title: '404 Not Found',
        description: 'Missing page',
        canonical: `${SITE_CONFIG.origin}/404.html`,
        robots: 'noindex, nofollow',
        ogImage: `${SITE_CONFIG.origin}/og/default.png`,
        h1: '404',
      }),
      'utf8',
    );

    const passing = await runCrawlerSimulation({ distDir: fixtureDist });
    expect(passing.mode).toBe('CONTROLLED_LOCAL_HTTP_SIMULATION');
    expect(passing.externalNetworkVerified).toBe(false);
    expect(passing.report.status).toBe('PASS');
    expect(passing.crawledRoutes.length).toBe(routes.length);
    expect(passing.crawlerMatrix.length).toBe(8);
    expect(passing.crawlerMatrix.every((row) => row.routesTested === routes.length)).toBe(true);

    // Inject broken internal link & localhost leak into about page to verify failure detection.
    const aboutFile = path.join(fixtureDist, 'about', 'index.html');
    fs.writeFileSync(
      aboutFile,
      buildValidHtmlPage({
        title: 'About AHADEX',
        description: 'About AHADEX Tools',
        canonical: 'http://localhost:3000/about/',
        robots: 'index, follow',
        ogImage: `${SITE_CONFIG.origin}/og/default.png`,
        h1: 'About AHADEX',
        linksHtml: '<a href="/missing-broken-target/">Broken</a>',
      }),
      'utf8',
    );

    const failing = await runCrawlerSimulation({ distDir: fixtureDist });
    expect(failing.report.status).toBe('FAIL');
    expect(failing.report.issues.some((i) => i.code === 'CRAWLER_BROKEN_INTERNAL_LINK')).toBe(true);
    expect(failing.report.issues.some((i) => i.code === 'CRAWLER_CANONICAL_MISMATCH')).toBe(true);
    expect(failing.report.issues.some((i) => i.code === 'CRAWLER_LOCALHOST_LEAK')).toBe(true);
  });
});
