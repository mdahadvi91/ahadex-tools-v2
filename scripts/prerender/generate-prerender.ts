/**
 * Build-time Static Site Generator (SSG / Prerender) for AHADEX Tools.
 *
 * Uses the production Vite client template (dist/index.html) and compiled SSR
 * bundle (.build/server/entry-server.js) to emit complete, crawlable static HTML
 * for every published route (Home, every live tool, and static informational pages),
 * plus a static 404.html fallback and updated llms.txt.
 */

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SITE_CONFIG } from '../../config/site.config';
import type { PageMetadata } from '../../src/platform/seo/metadata';
import { fileExists, readTextFile, resolveFromRoot, writeTextFile } from '../utils/file-utils';
import {
  discoverPublishedRoutes,
  discoverToolsFromFilesystem,
  type DiscoveredRoute,
} from '../utils/route-discovery';

export interface PrerenderHeadMetadata {
  readonly title: string;
  readonly description: string;
  readonly canonicalUrl: string;
  readonly robotsContent: string;
  readonly ogType: string;
  readonly ogImage: string;
  readonly ogImageAlt: string;
}

export interface PrerenderSummary {
  readonly generatedAt: string;
  readonly routeCount: number;
  readonly outputFiles: readonly string[];
}

export function escapeHtmlText(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export function escapeHtmlAttr(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export function injectPrerenderedDocument(
  templateHtml: string,
  appHtml: string,
  meta: PrerenderHeadMetadata,
): string {
  const safeTitle = escapeHtmlText(meta.title);
  const safeTitleAttr = escapeHtmlAttr(meta.title);
  const safeDescAttr = escapeHtmlAttr(meta.description);
  const safeCanonical = escapeHtmlAttr(meta.canonicalUrl);
  const safeRobots = escapeHtmlAttr(meta.robotsContent);
  const safeOgType = escapeHtmlAttr(meta.ogType);
  const safeOgImage = escapeHtmlAttr(meta.ogImage);
  const safeOgAlt = escapeHtmlAttr(meta.ogImageAlt);

  let html = templateHtml.replace(
    /<html([^>]*?)\sdata-prerender-ready="false"([^>]*)>/i,
    '<html$1 data-prerender-ready="true"$2>',
  );
  if (!html.includes('data-prerender-ready="true"')) {
    html = html.replace(/<html([^>]*)>/i, '<html$1 data-prerender-ready="true">');
  }

  // Strip base template SEO/OG tags cleanly so every emitted HTML document has exact single copies.
  html = html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+name="description"[\s\S]*?\/>\s*/gi, '')
    .replace(/<meta\s+name="robots"[\s\S]*?\/>\s*/gi, '')
    .replace(/<link\s+rel="canonical"[\s\S]*?\/>\s*/gi, '')
    .replace(/<meta\s+property="og:[^"]*"[\s\S]*?\/>\s*/gi, '')
    .replace(/<meta\s+name="twitter:[^"]*"[\s\S]*?\/>\s*/gi, '');

  const bingToken = (process.env.VITE_BING_SITE_VERIFICATION ?? '').trim();
  const yandexToken = (process.env.VITE_YANDEX_SITE_VERIFICATION ?? '').trim();

  const headTags = [
    `<title>${safeTitle}</title>`,
    `    <meta name="description" content="${safeDescAttr}" />`,
    `    <meta name="robots" content="${safeRobots}" />`,
    `    <link rel="canonical" href="${safeCanonical}" />`,
    ...(bingToken
      ? [`    <meta name="msvalidate.01" content="${escapeHtmlAttr(bingToken)}" />`]
      : []),
    ...(yandexToken
      ? [`    <meta name="yandex-verification" content="${escapeHtmlAttr(yandexToken)}" />`]
      : []),
    `    <meta property="og:type" content="${safeOgType}" />`,
    `    <meta property="og:locale" content="en_US" />`,
    `    <meta property="og:site_name" content="${escapeHtmlAttr(SITE_CONFIG.name)}" />`,
    `    <meta property="og:url" content="${safeCanonical}" />`,
    `    <meta property="og:title" content="${safeTitleAttr}" />`,
    `    <meta property="og:description" content="${safeDescAttr}" />`,
    `    <meta property="og:image" content="${safeOgImage}" />`,
    `    <meta property="og:image:width" content="1200" />`,
    `    <meta property="og:image:height" content="630" />`,
    `    <meta property="og:image:alt" content="${safeOgAlt}" />`,
    `    <meta name="twitter:card" content="summary_large_image" />`,
    `    <meta name="twitter:title" content="${safeTitleAttr}" />`,
    `    <meta name="twitter:description" content="${safeDescAttr}" />`,
    `    <meta name="twitter:image" content="${safeOgImage}" />`,
  ].join('\n');

  html = html.replace(/<\/head>/i, `    ${headTags}\n  </head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

  return html;
}

async function resolveRouteHeadMetadata(
  route: DiscoveredRoute,
  toolDirectories: ReadonlyMap<string, string>,
): Promise<PrerenderHeadMetadata> {
  const defaultOgImage = `${SITE_CONFIG.origin}/og/default.png`;
  const robotsContent = route.indexable
    ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    : 'noindex, follow';

  if (route.kind === 'tool') {
    const dir = toolDirectories.get(route.slug);
    const seoPath = dir ? path.join(dir, 'seo.ts') : '';
    if (seoPath && fileExists(seoPath)) {
      const seoMod = (await import(pathToFileURL(seoPath).href)) as {
        metadata?: PageMetadata;
        ogImageAlt?: string;
      };
      const seo = seoMod.metadata;
      const resolvedOg =
        seo?.ogImage ??
        (seo?.image
          ? `${SITE_CONFIG.origin}${seo.image}`
          : `${SITE_CONFIG.origin}/og/${route.slug}.png`);
      return {
        title: seo?.title ?? route.title,
        description: seo?.description ?? route.description,
        canonicalUrl: route.canonicalUrl,
        robotsContent: seo?.noIndex ? 'noindex, follow' : robotsContent,
        ogType: seo?.type ?? 'website',
        ogImage: resolvedOg,
        ogImageAlt: seoMod.ogImageAlt ?? `${route.title} preview`,
      };
    }
  }

  return {
    title: route.title,
    description: route.description,
    canonicalUrl: route.canonicalUrl,
    robotsContent,
    ogType: 'website',
    ogImage: defaultOgImage,
    ogImageAlt: `${SITE_CONFIG.name} — ${route.title}`,
  };
}

interface ToolContentModuleShape {
  HERO?: { h1?: string; tagline?: string };
  DIRECT_ANSWER?: string;
  HOW_IT_WORKS?: ReadonlyArray<{ title: string; body: string }>;
  TECHNICAL_LIMITS?: readonly string[];
  LIMITATIONS?: { heading?: string; list?: readonly string[] };
  FAQ?: ReadonlyArray<{ question: string; answer: string }>;
}

interface ToolKeywordsModuleShape {
  keywords?: {
    primary?: string;
    secondary?: readonly string[];
  };
  KEYWORDS?: {
    primary?: string;
    secondary?: readonly string[];
  };
}

async function generateLlmsDocuments(
  routes: readonly DiscoveredRoute[],
  toolDirectories: ReadonlyMap<string, string>,
): Promise<{ llmsTxt: string; llmsFullTxt: string }> {
  const liveToolRoutes = routes.filter((r) => r.kind === 'tool' && r.indexable);
  const infoRoutes = routes.filter((r) => r.kind !== 'tool' && r.indexable);

  const llmsLines = [
    `# ${SITE_CONFIG.name}`,
    '',
    `> ${SITE_CONFIG.tagline}. Every image and PDF utility runs 100% locally inside the user's browser using JavaScript, Canvas/WebCodecs, Web Workers, and pdf-lib — zero files are uploaded or stored on remote servers.`,
    '',
    `- Website: ${SITE_CONFIG.origin}/`,
    `- Full Reference for AI Assistants: ${SITE_CONFIG.origin}/llms-full.txt`,
    `- Sitemap: ${SITE_CONFIG.origin}/sitemap.xml`,
    `- Contact: ${SITE_CONFIG.contactEmail}`,
    '',
    '## Key Privacy & Pricing Facts',
    '- Cost: 100% free with no signup, no account wall, no usage caps, and no watermarks.',
    '- Architecture: Client-side static web app hosted on Cloudflare Pages; file bytes never leave browser memory.',
    '',
    '## Available Browser Tools',
    ...liveToolRoutes.map((r) => `- [${r.title}](${r.canonicalUrl}): ${r.description}`),
    '',
    '## Trust, Policy & Information Pages',
    ...infoRoutes
      .filter((r) => r.path !== '/')
      .map((r) => `- [${r.title}](${r.canonicalUrl}): ${r.description}`),
    '',
  ];

  const fullLines: string[] = [
    `# ${SITE_CONFIG.name} — Complete AI Knowledge Reference`,
    '',
    `> ${SITE_CONFIG.tagline}. All tools run strictly on-device in browser memory with 0 bytes of user files uploaded to external servers.`,
    '',
    `- Canonical Origin: ${SITE_CONFIG.origin}/`,
    `- Concise Index: ${SITE_CONFIG.origin}/llms.txt`,
    `- XML Sitemap: ${SITE_CONFIG.origin}/sitemap.xml`,
    '',
  ];

  for (const route of liveToolRoutes) {
    const dir = toolDirectories.get(route.slug);
    let contentMod: ToolContentModuleShape = {};
    let kwMod: ToolKeywordsModuleShape = {};
    if (dir) {
      const contentPath = path.join(dir, 'content.ts');
      const kwPath = path.join(dir, 'keywords.ts');
      if (fileExists(contentPath)) {
        contentMod = (await import(pathToFileURL(contentPath).href)) as ToolContentModuleShape;
      }
      if (fileExists(kwPath)) {
        kwMod = (await import(pathToFileURL(kwPath).href)) as ToolKeywordsModuleShape;
      }
    }

    const kw = kwMod.keywords ?? kwMod.KEYWORDS;
    const limits = contentMod.LIMITATIONS?.list ?? contentMod.TECHNICAL_LIMITS;

    fullLines.push(`## ${contentMod.HERO?.h1 ?? route.title}`);
    fullLines.push(`- URL: ${route.canonicalUrl}`);
    if (kw?.primary) {
      fullLines.push(`- Primary Topic: ${kw.primary}`);
    }
    if (kw?.secondary && kw.secondary.length > 0) {
      fullLines.push(`- Related Capabilities: ${kw.secondary.join(', ')}`);
    }
    if (contentMod.DIRECT_ANSWER) {
      fullLines.push(`- Summary: ${contentMod.DIRECT_ANSWER}`);
    } else {
      fullLines.push(`- Summary: ${route.description}`);
    }

    if (contentMod.HOW_IT_WORKS && contentMod.HOW_IT_WORKS.length > 0) {
      fullLines.push('- Workflow:');
      contentMod.HOW_IT_WORKS.forEach((step, idx) => {
        fullLines.push(`  ${idx + 1}. ${step.title}: ${step.body}`);
      });
    }

    if (limits && limits.length > 0) {
      fullLines.push('- Supported Limits & Constraints:');
      for (const limit of limits) {
        fullLines.push(`  - ${limit}`);
      }
    }

    if (contentMod.FAQ && contentMod.FAQ.length > 0) {
      fullLines.push('- Frequently Asked Questions:');
      for (const faq of contentMod.FAQ.slice(0, 5)) {
        fullLines.push(`  - Q: ${faq.question}`);
        fullLines.push(`    A: ${faq.answer}`);
      }
    }

    fullLines.push('');
  }

  return {
    llmsTxt: llmsLines.join('\n'),
    llmsFullTxt: fullLines.join('\n'),
  };
}

export async function generatePrerenderedSite(
  options: {
    distDir?: string;
    ssrEntryPath?: string;
    toolsRoot?: string;
  } = {},
): Promise<PrerenderSummary> {
  const distDir = options.distDir ?? resolveFromRoot('dist');
  const ssrEntryPath =
    options.ssrEntryPath ?? resolveFromRoot('.build', 'server', 'entry-server.js');
  const templatePath = path.join(distDir, 'index.html');

  if (!fileExists(templatePath)) {
    throw new Error(
      `Missing client build template at ${templatePath}. Run "npm run build:client" first.`,
    );
  }
  if (!fileExists(ssrEntryPath)) {
    throw new Error(`Missing SSR bundle at ${ssrEntryPath}. Run "npm run build:ssr" first.`);
  }

  // Ensure SSR runtime resolves production canonical origin rather than dev localhost.
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }
  if (!process.env.VITE_SITE_URL) {
    process.env.VITE_SITE_URL = SITE_CONFIG.origin;
  }

  // Keep raw unprerendered dist/index.html cleanly in memory before overwriting it for "/".
  const templateHtml = readTextFile(templatePath);
  const ssrMod = (await import(pathToFileURL(ssrEntryPath).href)) as {
    render?: (url: string) => string;
  };
  if (typeof ssrMod.render !== 'function') {
    throw new Error(`SSR entry at ${ssrEntryPath} does not export a render(url) function.`);
  }

  const tools = await discoverToolsFromFilesystem(options.toolsRoot);
  const toolDirectories = new Map(tools.map((t) => [t.slug, t.directory]));
  const routes = await discoverPublishedRoutes(options.toolsRoot);
  const outputFiles: string[] = [];

  for (const route of routes) {
    const appHtml = ssrMod.render(route.path);
    const headMeta = await resolveRouteHeadMetadata(route, toolDirectories);
    const fullHtml = injectPrerenderedDocument(templateHtml, appHtml, headMeta);

    const outFile =
      route.path === '/'
        ? path.join(distDir, 'index.html')
        : path.join(distDir, route.path.replace(/^\/+|\/+$/g, ''), 'index.html');

    writeTextFile(outFile, fullHtml);
    outputFiles.push(path.relative(distDir, outFile));
  }

  // Emit static 404.html so Cloudflare Pages returns proper 404 HTML for unknown URLs.
  const notFoundHtml = injectPrerenderedDocument(templateHtml, ssrMod.render('/404-not-found/'), {
    title: `Page Not Found | ${SITE_CONFIG.name}`,
    description: 'The requested page could not be found on AHADEX Tools.',
    canonicalUrl: `${SITE_CONFIG.origin}/404.html`,
    robotsContent: 'noindex, nofollow',
    ogType: 'website',
    ogImage: `${SITE_CONFIG.origin}/og/default.png`,
    ogImageAlt: `${SITE_CONFIG.name} 404 Not Found`,
  });
  writeTextFile(path.join(distDir, '404.html'), notFoundHtml);
  outputFiles.push('404.html');

  // Keep llms.txt and llms-full.txt cleanly updated during prerendering for AI answer engines.
  const { llmsTxt, llmsFullTxt } = await generateLlmsDocuments(routes, toolDirectories);
  writeTextFile(path.join(distDir, 'llms.txt'), llmsTxt);
  writeTextFile(resolveFromRoot('public', 'llms.txt'), llmsTxt);
  writeTextFile(path.join(distDir, 'llms-full.txt'), llmsFullTxt);
  writeTextFile(resolveFromRoot('public', 'llms-full.txt'), llmsFullTxt);

  return {
    generatedAt: new Date().toISOString(),
    routeCount: routes.length,
    outputFiles,
  };
}

const isDirectExecution =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  const summary = await generatePrerenderedSite();
  console.log(
    `[PASS] prerender — generated ${summary.outputFiles.length} HTML files for ${summary.routeCount} published routes.`,
  );
  for (const file of summary.outputFiles) {
    console.log(`  - dist/${file}`);
  }
}
