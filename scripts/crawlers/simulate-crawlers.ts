/**
 * Controlled Local HTTP Crawler Simulation for AHADEX Tools (Phase 8 / P2).
 *
 * Spins up an ephemeral local HTTP server backed strictly by static `dist/`
 * build artifacts and performs real HTTP GET fetches (no JavaScript execution)
 * across ALL published routes using Search Engine and AI Bot User-Agent headers.
 *
 * Scope honesty: This validates prerendered static HTML, headers, robots.txt,
 * sitemap.xml, llms.txt, internal links, and referenced assets in a local controlled
 * HTTP simulation. It does NOT perform external live Googlebot/Bingbot network calls.
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_CONFIG } from '../../config/site.config';
import type { ValidationIssue, ValidationReport } from '../../src/types/tool';
import { fileExists, readTextFile, resolveFromRoot, writeTextFile } from '../utils/file-utils';
import { discoverPublishedRoutes, type DiscoveredRoute } from '../utils/route-discovery';
import { assertReportPassed, createValidationReport } from '../utils/validation-utils';

export interface CrawlerProfile {
  readonly name: string;
  readonly agentMatch: string;
  readonly userAgent: string;
  readonly category: 'search' | 'ai';
}

export const CRAWLER_PROFILES: readonly CrawlerProfile[] = [
  {
    name: 'Googlebot Desktop',
    agentMatch: 'Googlebot',
    userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    category: 'search',
  },
  {
    name: 'Googlebot Smartphone',
    agentMatch: 'Googlebot',
    userAgent:
      'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    category: 'search',
  },
  {
    name: 'Google-InspectionTool',
    agentMatch: 'Googlebot',
    userAgent: 'Mozilla/5.0 (compatible; Google-InspectionTool/1.0;)',
    category: 'search',
  },
  {
    name: 'Bingbot',
    agentMatch: 'Bingbot',
    userAgent: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    category: 'search',
  },
  {
    name: 'GoogleOther',
    agentMatch: 'GoogleOther',
    userAgent:
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GoogleOther) Chrome/120.0.0.0 Safari/537.36',
    category: 'ai',
  },
  {
    name: 'GPTBot',
    agentMatch: 'GPTBot',
    userAgent:
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.0; +https://openai.com/gptbot',
    category: 'ai',
  },
  {
    name: 'OAI-SearchBot',
    agentMatch: 'OAI-SearchBot',
    userAgent:
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot',
    category: 'ai',
  },
  {
    name: 'PerplexityBot',
    agentMatch: 'PerplexityBot',
    userAgent:
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot',
    category: 'ai',
  },
];

export interface AgentRuleSet {
  readonly allow: string[];
  readonly disallow: string[];
}

export interface ParsedRobotsTxt {
  readonly agentRules: Map<string, AgentRuleSet>;
  readonly sitemaps: string[];
}

export interface ExtractedHtmlSignals {
  readonly prerenderReady: boolean;
  readonly rootPopulated: boolean;
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly robots: string;
  readonly ogTitle: string;
  readonly ogDescription: string;
  readonly ogUrl: string;
  readonly ogImage: string;
  readonly twitterCard: string;
  readonly twitterTitle: string;
  readonly twitterImage: string;
  readonly h1Count: number;
  readonly jsonLdCount: number;
  readonly jsonLdErrors: readonly string[];
  readonly internalLinks: readonly string[];
  readonly referencedAssets: readonly string[];
  readonly visibleWordCount: number;
  readonly hasLocalhostLeak: boolean;
}

export interface AgentMatrixEntry {
  readonly crawler: string;
  readonly category: 'search' | 'ai';
  readonly robotsAllowedHome: boolean;
  readonly robotsBlocked404: boolean;
  readonly routesTested: number;
  readonly failedRequests: number;
}

export interface CrawledRouteSummary {
  readonly path: string;
  readonly kind: 'static' | 'tool';
  readonly httpStatus: number;
  readonly indexable: boolean;
  readonly canonicalMatch: boolean;
  readonly visibleWordCount: number;
  readonly jsonLdCount: number;
}

export interface CrawlerSimulationResult {
  readonly mode: 'CONTROLLED_LOCAL_HTTP_SIMULATION';
  readonly externalNetworkVerified: false;
  readonly scopeNotice: string;
  readonly generatedAt: string;
  readonly crawlerMatrix: readonly AgentMatrixEntry[];
  readonly crawledRoutes: readonly CrawledRouteSummary[];
  readonly checkedInternalLinks: number;
  readonly checkedAssets: number;
  readonly report: ValidationReport;
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function decodeBasicEntities(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&#x27;', "'");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getMetaAttrContent(html: string, attrName: 'name' | 'property', key: string): string {
  const escaped = escapeRegExp(key);
  const patternA = new RegExp(
    `<meta\\s+[^>]*${attrName}=["']${escaped}["'][^>]*content=["']([^"']*)["'][^>]*>`,
    'i',
  );
  const matchA = html.match(patternA);
  if (matchA?.[1] !== undefined) {
    return decodeBasicEntities(matchA[1].trim());
  }

  const patternB = new RegExp(
    `<meta\\s+[^>]*content=["']([^"']*)["'][^>]*${attrName}=["']${escaped}["'][^>]*>`,
    'i',
  );
  const matchB = html.match(patternB);
  return matchB?.[1] !== undefined ? decodeBasicEntities(matchB[1].trim()) : '';
}

function getCanonicalHref(html: string): string {
  const matchA = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["'][^>]*>/i);
  if (matchA?.[1] !== undefined) {
    return decodeBasicEntities(matchA[1].trim());
  }
  const matchB = html.match(/<link\s+[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["'][^>]*>/i);
  return matchB?.[1] !== undefined ? decodeBasicEntities(matchB[1].trim()) : '';
}

export function parseRobotsTxt(content: string): ParsedRobotsTxt {
  const agentRules = new Map<string, AgentRuleSet>();
  const sitemaps: string[] = [];
  let activeAgents: string[] = [];
  let seenDirectiveSinceAgent = false;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) {
      activeAgents = [];
      seenDirectiveSinceAgent = false;
      continue;
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) {
      continue;
    }

    const directive = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();

    if (directive === 'user-agent') {
      const normalizedAgent = value.toLowerCase();
      if (seenDirectiveSinceAgent) {
        activeAgents = [normalizedAgent];
        seenDirectiveSinceAgent = false;
      } else {
        activeAgents.push(normalizedAgent);
      }
      if (!agentRules.has(normalizedAgent)) {
        agentRules.set(normalizedAgent, { allow: [], disallow: [] });
      }
      continue;
    }

    if (directive === 'sitemap') {
      if (value) {
        sitemaps.push(value);
      }
      continue;
    }

    if (directive === 'allow' || directive === 'disallow') {
      seenDirectiveSinceAgent = true;
      for (const agent of activeAgents) {
        const rules = agentRules.get(agent) ?? { allow: [], disallow: [] };
        if (value) {
          rules[directive].push(value);
        }
        agentRules.set(agent, rules);
      }
    }
  }

  return { agentRules, sitemaps };
}

export function isAllowedByRobots(
  parsed: ParsedRobotsTxt,
  agentToken: string,
  urlPath: string,
): boolean {
  const normalizedToken = agentToken.toLowerCase();
  const matchedRules = parsed.agentRules.get(normalizedToken) ??
    parsed.agentRules.get('*') ?? { allow: [], disallow: [] };

  let bestLength = -1;
  let bestAllowed = true;

  for (const rulePath of matchedRules.disallow) {
    if (urlPath.startsWith(rulePath) && rulePath.length > bestLength) {
      bestLength = rulePath.length;
      bestAllowed = false;
    }
  }

  for (const rulePath of matchedRules.allow) {
    if (urlPath.startsWith(rulePath) && rulePath.length >= bestLength) {
      bestLength = rulePath.length;
      bestAllowed = true;
    }
  }

  return bestAllowed;
}

export function extractHtmlSignals(html: string): ExtractedHtmlSignals {
  const prerenderReady = /<html[^>]*data-prerender-ready=["']true["'][^>]*>/i.test(html);
  const rootMatch = html.match(/<div\s+id=["']root["'][^>]*>([\s\S]*?)<\/div>/i);
  const rootPopulated =
    !html.includes('<div id="root"></div>') &&
    Boolean(rootMatch?.[1] && rootMatch[1].trim().length > 0);

  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = titleMatch?.[1] ? decodeBasicEntities(titleMatch[1].trim()) : '';

  const h1Matches = html.match(/<h1(?:\s[^>]*)?>[\s\S]*?<\/h1>/gi) ?? [];

  const jsonLdErrors: string[] = [];
  let jsonLdCount = 0;
  const ldPattern = /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(ldPattern)) {
    jsonLdCount++;
    const rawJson = (match[1] ?? '').trim();
    try {
      JSON.parse(rawJson);
    } catch (err) {
      jsonLdErrors.push(err instanceof Error ? err.message : 'Invalid JSON-LD');
    }
  }

  const linkSet = new Set<string>();
  const hrefPattern = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
  for (const match of html.matchAll(hrefPattern)) {
    const href = decodeBasicEntities((match[1] ?? '').trim());
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      continue;
    }
    if (href.startsWith('/')) {
      const withoutHash = href.split('#')[0]?.split('?')[0] || '/';
      linkSet.add(withoutHash);
    } else if (href.startsWith(SITE_CONFIG.origin)) {
      const parsed = new URL(href);
      linkSet.add(parsed.pathname || '/');
    }
  }

  const assetSet = new Set<string>();
  const ogImage = getMetaAttrContent(html, 'property', 'og:image');
  if (ogImage.startsWith(SITE_CONFIG.origin)) {
    assetSet.add(new URL(ogImage).pathname);
  }
  for (const imgMatch of html.matchAll(/<img\s+[^>]*src=["'](\/[^"']+)["'][^>]*>/gi)) {
    if (imgMatch[1]) assetSet.add(imgMatch[1]);
  }
  for (const iconMatch of html.matchAll(
    /<link\s+[^>]*rel=["'](?:icon|preload)["'][^>]*href=["'](\/[^"']+)["'][^>]*>/gi,
  )) {
    if (iconMatch[1]) assetSet.add(iconMatch[1]);
  }

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyHtml = bodyMatch?.[1] ?? html;
  const textOnly = decodeBasicEntities(
    bodyHtml
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  );
  const visibleWordCount = textOnly
    .trim()
    .split(/\s+/)
    .filter((token) => /[a-z0-9]/i.test(token)).length;

  return {
    prerenderReady,
    rootPopulated,
    title,
    description: getMetaAttrContent(html, 'name', 'description'),
    canonical: getCanonicalHref(html),
    robots: getMetaAttrContent(html, 'name', 'robots'),
    ogTitle: getMetaAttrContent(html, 'property', 'og:title'),
    ogDescription: getMetaAttrContent(html, 'property', 'og:description'),
    ogUrl: getMetaAttrContent(html, 'property', 'og:url'),
    ogImage,
    twitterCard: getMetaAttrContent(html, 'name', 'twitter:card'),
    twitterTitle: getMetaAttrContent(html, 'name', 'twitter:title'),
    twitterImage: getMetaAttrContent(html, 'name', 'twitter:image'),
    h1Count: h1Matches.length,
    jsonLdCount,
    jsonLdErrors,
    internalLinks: Array.from(linkSet),
    referencedAssets: Array.from(assetSet),
    visibleWordCount,
    hasLocalhostLeak: /https?:\/\/(?:localhost|127\.0\.0\.1)/i.test(html),
  };
}

function resolveDistTarget(distDir: string, requestPathname: string): string | null {
  const cleanPathname = decodeURIComponent(requestPathname);
  const normalizedRoot = path.resolve(distDir);

  const relativePath = cleanPathname.replace(/^\/+/, '');
  let candidate = path.resolve(normalizedRoot, relativePath);

  if (!candidate.startsWith(normalizedRoot)) {
    return null;
  }

  if (cleanPathname === '/' || cleanPathname.endsWith('/')) {
    candidate = path.join(candidate, 'index.html');
  }

  if (fileExists(candidate)) {
    return candidate;
  }

  return null;
}

export async function startStaticDistServer(distDir: string): Promise<{
  readonly origin: string;
  readonly close: () => Promise<void>;
}> {
  const server = http.createServer((req, res) => {
    const reqUrl = new URL(req.url ?? '/', 'http://127.0.0.1');
    const resolvedFile = resolveDistTarget(distDir, reqUrl.pathname);

    if (!resolvedFile) {
      const notFoundPage = path.join(distDir, '404.html');
      const body = fileExists(notFoundPage) ? readTextFile(notFoundPage) : '404 Not Found';
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(body);
      return;
    }

    const ext = path.extname(resolvedFile).toLowerCase();
    const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';

    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.webp' || ext === '.ico') {
      const buffer = fs.readFileSync(resolvedFile);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(buffer);
      return;
    }

    const text = readTextFile(resolvedFile);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(text);
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to bind ephemeral crawler simulation HTTP server.');
  }

  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

function validateCrawledPage(
  route: DiscoveredRoute,
  status: number,
  contentType: string,
  html: string,
  issues: ValidationIssue[],
  crawlerLabel = 'Googlebot Desktop',
): ExtractedHtmlSignals {
  const target = `${crawlerLabel}:${route.path}`;
  const signals = extractHtmlSignals(html);

  if (status !== 200) {
    issues.push({
      code: 'CRAWLER_HTTP_NON_200',
      severity: 'critical',
      target,
      message: `Expected HTTP 200 for ${route.path} but received ${status}.`,
    });
  }

  if (!contentType.includes('text/html')) {
    issues.push({
      code: 'CRAWLER_CONTENT_TYPE_INVALID',
      severity: 'critical',
      target,
      message: `Expected text/html Content-Type for ${route.path}, got "${contentType}".`,
    });
  }

  if (!signals.prerenderReady || !signals.rootPopulated) {
    issues.push({
      code: 'CRAWLER_EMPTY_HTML_SHELL',
      severity: 'critical',
      target,
      message: `${route.path} returned an unprerendered or empty #root shell to non-JS crawlers.`,
    });
  }

  if (!signals.title) {
    issues.push({
      code: 'CRAWLER_MISSING_TITLE',
      severity: 'critical',
      target,
      message: `${route.path} is missing a rendered <title> tag.`,
    });
  }

  if (!signals.description) {
    issues.push({
      code: 'CRAWLER_MISSING_DESCRIPTION',
      severity: 'critical',
      target,
      message: `${route.path} is missing <meta name="description">.`,
    });
  }

  if (signals.canonical !== route.canonicalUrl) {
    issues.push({
      code: 'CRAWLER_CANONICAL_MISMATCH',
      severity: 'critical',
      target,
      message: `Canonical mismatch on ${route.path}: expected "${route.canonicalUrl}", got "${signals.canonical || 'missing'}".`,
    });
  }

  const expectsNoindex = !route.indexable;
  const hasNoindex = /\bnoindex\b/i.test(signals.robots);
  if (expectsNoindex && !hasNoindex) {
    issues.push({
      code: 'CRAWLER_MISSING_NOINDEX',
      severity: 'critical',
      target,
      message: `${route.path} has indexable=false but static meta robots allows indexing ("${signals.robots}").`,
    });
  } else if (!expectsNoindex && hasNoindex) {
    issues.push({
      code: 'CRAWLER_UNEXPECTED_NOINDEX',
      severity: 'critical',
      target,
      message: `${route.path} is indexable=true but serves noindex in static HTML.`,
    });
  }

  if (
    !signals.ogTitle ||
    !signals.ogDescription ||
    signals.ogUrl !== route.canonicalUrl ||
    !signals.ogImage
  ) {
    issues.push({
      code: 'CRAWLER_INCOMPLETE_OG_TAGS',
      severity: 'critical',
      target,
      message: `${route.path} has missing or mismatched Open Graph tags in static HTML.`,
    });
  }

  if (!signals.twitterCard || !signals.twitterTitle || !signals.twitterImage) {
    issues.push({
      code: 'CRAWLER_INCOMPLETE_TWITTER_TAGS',
      severity: 'warning',
      target,
      message: `${route.path} has incomplete Twitter Card metadata.`,
    });
  }

  if (signals.h1Count !== 1) {
    issues.push({
      code: 'CRAWLER_H1_COUNT_INVALID',
      severity: 'critical',
      target,
      message: `${route.path} must render exactly 1 <h1> in no-JS HTML (found ${signals.h1Count}).`,
    });
  }

  if (signals.jsonLdErrors.length > 0) {
    issues.push({
      code: 'CRAWLER_JSONLD_PARSE_ERROR',
      severity: 'critical',
      target,
      message: `${route.path} contains invalid JSON-LD: ${signals.jsonLdErrors.join('; ')}`,
    });
  }

  if (route.kind === 'tool' && signals.jsonLdCount === 0) {
    issues.push({
      code: 'CRAWLER_TOOL_MISSING_JSONLD',
      severity: 'critical',
      target,
      message: `Tool page ${route.path} renders zero JSON-LD scripts in no-JS HTML.`,
    });
  }

  const minWords = route.kind === 'tool' || route.path === '/' ? 150 : 60;
  if (signals.visibleWordCount < minWords) {
    issues.push({
      code: 'CRAWLER_THIN_STATIC_TEXT',
      severity: 'critical',
      target,
      message: `${route.path} exposes only ${signals.visibleWordCount} words without JS (minimum ${minWords}).`,
    });
  }

  if (signals.hasLocalhostLeak) {
    issues.push({
      code: 'CRAWLER_LOCALHOST_LEAK',
      severity: 'critical',
      target,
      message: `${route.path} contains a localhost URL in static HTML or structured data.`,
    });
  }

  return signals;
}

async function fetchWithAgent(
  origin: string,
  reqPath: string,
  userAgent: string,
): Promise<{ status: number; contentType: string; body: string }> {
  const response = await fetch(`${origin}${reqPath}`, {
    headers: {
      'User-Agent': userAgent,
    },
    redirect: 'manual',
  });
  const body = await response.text();
  return {
    status: response.status,
    contentType: response.headers.get('content-type') ?? '',
    body,
  };
}

export async function runCrawlerSimulation(
  options: {
    distDir?: string;
    toolsRoot?: string;
    writeReportPath?: string;
  } = {},
): Promise<CrawlerSimulationResult> {
  const distDir = options.distDir ?? resolveFromRoot('dist');
  const issues: ValidationIssue[] = [];
  const crawlerMatrix: AgentMatrixEntry[] = [];
  const crawledRoutes: CrawledRouteSummary[] = [];

  if (!fileExists(path.join(distDir, 'index.html'))) {
    throw new Error(
      `Missing ${path.join(distDir, 'index.html')}. Run "npm run build:ssg" before crawler checks.`,
    );
  }

  const routes = await discoverPublishedRoutes(options.toolsRoot);
  const server = await startStaticDistServer(distDir);
  let checkedCount = 0;
  let checkedInternalLinks = 0;
  let checkedAssets = 0;

  try {
    const primaryBot = CRAWLER_PROFILES[0];

    // 1. Verify robots.txt, sitemap.xml, and llms.txt via real HTTP GET.
    const robotsRes = await fetchWithAgent(server.origin, '/robots.txt', primaryBot.userAgent);
    checkedCount++;
    if (robotsRes.status !== 200) {
      issues.push({
        code: 'CRAWLER_ROBOTS_UNREACHABLE',
        severity: 'critical',
        target: '/robots.txt',
        message: `/robots.txt returned HTTP ${robotsRes.status}.`,
      });
    }
    const parsedRobots = parseRobotsTxt(robotsRes.body);
    if (!parsedRobots.sitemaps.includes(`${SITE_CONFIG.origin}/sitemap.xml`)) {
      issues.push({
        code: 'CRAWLER_ROBOTS_SITEMAP_MISSING',
        severity: 'critical',
        target: '/robots.txt',
        message: `/robots.txt did not return authoritative Sitemap: ${SITE_CONFIG.origin}/sitemap.xml`,
      });
    }

    const sitemapRes = await fetchWithAgent(server.origin, '/sitemap.xml', primaryBot.userAgent);
    checkedCount++;
    if (sitemapRes.status !== 200 || !sitemapRes.contentType.includes('xml')) {
      issues.push({
        code: 'CRAWLER_SITEMAP_UNREACHABLE',
        severity: 'critical',
        target: '/sitemap.xml',
        message: `/sitemap.xml failed HTTP check (status=${sitemapRes.status}, type="${sitemapRes.contentType}").`,
      });
    }
    const sitemapLocs = Array.from(sitemapRes.body.matchAll(/<loc>(.*?)<\/loc>/g)).map((m) =>
      decodeBasicEntities((m[1] ?? '').trim()),
    );
    if (sitemapLocs.length === 0) {
      issues.push({
        code: 'CRAWLER_SITEMAP_EMPTY',
        severity: 'critical',
        target: '/sitemap.xml',
        message: '/sitemap.xml returned zero <loc> entries.',
      });
    }

    const llmsRes = await fetchWithAgent(server.origin, '/llms.txt', primaryBot.userAgent);
    checkedCount++;
    if (llmsRes.status !== 200 || !llmsRes.body.includes(SITE_CONFIG.name)) {
      issues.push({
        code: 'CRAWLER_LLMS_UNREACHABLE',
        severity: 'critical',
        target: '/llms.txt',
        message: `/llms.txt failed HTTP check (status=${llmsRes.status}).`,
      });
    }
    for (const toolRoute of routes.filter((r) => r.kind === 'tool' && r.indexable)) {
      if (!llmsRes.body.includes(toolRoute.canonicalUrl)) {
        issues.push({
          code: 'CRAWLER_LLMS_MISSING_TOOL',
          severity: 'critical',
          target: toolRoute.canonicalUrl,
          message: `/llms.txt served over HTTP is missing tool URL ${toolRoute.canonicalUrl}.`,
        });
      }
    }

    // 2. Crawl every published route under ALL crawler profiles and record links/assets.
    const discoveredLinks = new Set<string>();
    const discoveredAssets = new Set<string>();

    for (const profile of CRAWLER_PROFILES) {
      const robotsAllowedHome = isAllowedByRobots(parsedRobots, profile.agentMatch, '/');
      const robotsBlocked404 = !isAllowedByRobots(parsedRobots, profile.agentMatch, '/404.html');
      let failedRequests = 0;

      if (!robotsAllowedHome) {
        issues.push({
          code: 'CRAWLER_BLOCKED_BY_ROBOTS',
          severity: 'critical',
          target: profile.name,
          message: `${profile.name} is disallowed from "/" in robots.txt.`,
        });
      }
      if (!robotsBlocked404) {
        issues.push({
          code: 'CRAWLER_404_NOT_DISALLOWED',
          severity: 'warning',
          target: profile.name,
          message: `/404.html should be disallowed for ${profile.name} in robots.txt.`,
        });
      }

      for (const route of routes) {
        checkedCount++;
        const allowed = isAllowedByRobots(parsedRobots, profile.agentMatch, route.path);
        if (!allowed) {
          failedRequests++;
          issues.push({
            code: 'CRAWLER_ROUTE_DISALLOWED',
            severity: 'critical',
            target: `${profile.name}:${route.path}`,
            message: `${profile.name} is disallowed from crawling ${route.path}.`,
          });
          continue;
        }

        const res = await fetchWithAgent(server.origin, route.path, profile.userAgent);
        const issueCountBefore = issues.length;
        const signals = validateCrawledPage(
          route,
          res.status,
          res.contentType,
          res.body,
          issues,
          profile.name,
        );
        if (issues.length > issueCountBefore) {
          failedRequests++;
        }

        if (profile === primaryBot) {
          for (const link of signals.internalLinks) {
            discoveredLinks.add(link);
          }
          for (const assetPath of signals.referencedAssets) {
            discoveredAssets.add(assetPath);
          }
          crawledRoutes.push({
            path: route.path,
            kind: route.kind,
            httpStatus: res.status,
            indexable: route.indexable,
            canonicalMatch: signals.canonical === route.canonicalUrl,
            visibleWordCount: signals.visibleWordCount,
            jsonLdCount: signals.jsonLdCount,
          });
        }
      }

      crawlerMatrix.push({
        crawler: profile.name,
        category: profile.category,
        robotsAllowedHome,
        robotsBlocked404,
        routesTested: routes.length,
        failedRequests,
      });
    }

    // 3. Test every sitemap <loc> returns HTTP 200.
    for (const loc of sitemapLocs) {
      checkedCount++;
      if (!loc.startsWith(SITE_CONFIG.origin)) {
        issues.push({
          code: 'CRAWLER_SITEMAP_WRONG_ORIGIN',
          severity: 'critical',
          target: loc,
          message: `Sitemap URL "${loc}" does not use ${SITE_CONFIG.origin}.`,
        });
        continue;
      }
      const locPath = new URL(loc).pathname;
      const res = await fetchWithAgent(server.origin, locPath, primaryBot.userAgent);
      if (res.status !== 200) {
        issues.push({
          code: 'CRAWLER_SITEMAP_URL_ERROR',
          severity: 'critical',
          target: loc,
          message: `Sitemap URL "${loc}" returned HTTP ${res.status}.`,
        });
      }
    }

    // 4. Verify all internal <a href> targets resolve HTTP 200 and use trailing slashes.
    for (const linkPath of discoveredLinks) {
      checkedCount++;
      checkedInternalLinks++;
      if (linkPath !== '/' && !linkPath.includes('.') && !linkPath.endsWith('/')) {
        issues.push({
          code: 'CRAWLER_INTERNAL_LINK_NO_TRAILING_SLASH',
          severity: 'critical',
          target: linkPath,
          message: `Internal link "${linkPath}" in static HTML omits required trailing slash.`,
        });
      }
      const res = await fetchWithAgent(server.origin, linkPath, primaryBot.userAgent);
      if (res.status !== 200) {
        issues.push({
          code: 'CRAWLER_BROKEN_INTERNAL_LINK',
          severity: 'critical',
          target: linkPath,
          message: `Internal link "${linkPath}" returned HTTP ${res.status}.`,
        });
      }
    }

    // 5. Verify all referenced OG banners, logos, and icons over HTTP.
    for (const assetPath of discoveredAssets) {
      checkedCount++;
      checkedAssets++;
      const res = await fetchWithAgent(server.origin, assetPath, primaryBot.userAgent);
      if (res.status !== 200) {
        issues.push({
          code: 'CRAWLER_MISSING_ASSET',
          severity: 'critical',
          target: assetPath,
          message: `Referenced static asset "${assetPath}" returned HTTP ${res.status}.`,
        });
      }
    }

    // 6. Verify unknown routes return genuine HTTP 404 (not soft-404 200) with noindex.
    checkedCount++;
    const missingRes = await fetchWithAgent(
      server.origin,
      '/__crawler-nonexistent-check__/',
      primaryBot.userAgent,
    );
    if (missingRes.status !== 404) {
      issues.push({
        code: 'CRAWLER_SOFT_404_DETECTED',
        severity: 'critical',
        target: '/__crawler-nonexistent-check__/',
        message: `Expected HTTP 404 for unknown route, got ${missingRes.status} (soft-404 risk).`,
      });
    } else if (!missingRes.body.includes('noindex')) {
      issues.push({
        code: 'CRAWLER_404_INDEXABLE',
        severity: 'warning',
        target: '/404.html',
        message: 'Static 404 response does not explicitly declare noindex.',
      });
    }
  } finally {
    await server.close();
  }

  const result: CrawlerSimulationResult = {
    mode: 'CONTROLLED_LOCAL_HTTP_SIMULATION',
    externalNetworkVerified: false,
    scopeNotice:
      'Controlled local HTTP GET simulation against static dist/ files without JavaScript execution; external Search Console / live Googlebot / Bingbot network fetches are post-deploy manual/external checks.',
    generatedAt: new Date().toISOString(),
    crawlerMatrix,
    crawledRoutes,
    checkedInternalLinks,
    checkedAssets,
    report: createValidationReport('crawler:local-http-simulation', checkedCount, issues),
  };

  if (options.writeReportPath) {
    writeTextFile(options.writeReportPath, `${JSON.stringify(result, null, 2)}\n`);
  }

  return result;
}

function printCrawlerSummary(result: CrawlerSimulationResult): void {
  console.log(`\n=== ${result.mode} ===`);
  console.log(`Scope Notice: ${result.scopeNotice}`);
  console.log(
    `Routes crawled: ${result.crawledRoutes.length} | Internal links checked: ${result.checkedInternalLinks} | Referenced assets checked: ${result.checkedAssets}`,
  );
  console.log('Agent Matrix (all published routes checked per agent):');
  for (const row of result.crawlerMatrix) {
    const statusLabel = row.robotsAllowedHome && row.failedRequests === 0 ? 'ALLOW+200' : 'ISSUES';
    console.log(
      `  - ${row.crawler} (${row.category}): ${statusLabel}, routes=${row.routesTested}, failures=${row.failedRequests}`,
    );
  }
  console.log('');
}

const isDirectExecution =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  const strict = process.argv.includes('--strict');
  const writeFlag = process.argv.includes('--write-report');
  const writeReportPath = writeFlag ? resolveFromRoot('reports', 'crawler-audit.json') : undefined;

  const result = await runCrawlerSimulation({ writeReportPath });
  printCrawlerSummary(result);
  assertReportPassed(result.report, strict);
}
