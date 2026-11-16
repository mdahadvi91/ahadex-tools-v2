/**
 * Generate a consolidated metadata bundle at public/metadata.json.
 *
 * Each entry contains: title, description, canonical, ogImage, ogType,
 * jsonLd (for tool pages). The SPA reads this at runtime and injects
 * into <head>. The static HTML generator also consumes it.
 */

import { join } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { discoverTools } from '../../utils/route-discovery';
import { PATHS } from '../../utils/constants';
import { logger } from '../../utils/logger';

const SITE_URL = 'https://ahadex.online';
const OUTPUT_PATH = join(PATHS.public, 'metadata.json');

interface RouteMeta {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  ogType: string;
  jsonLd?: unknown;
}

const STATIC_ROUTES: Record<string, RouteMeta> = {
  '/': {
    title: 'AHADEX Tools - Privacy-First Browser File Tools',
    description:
      'Free browser-based image and PDF tools. Files never leave your device. No signup, no uploads, no tracking.',
    canonical: SITE_URL,
    ogImage: `${SITE_URL}/images/logo.png`,
    ogType: 'website',
  },
  '/tools': {
    title: 'All Tools - AHADEX Tools',
    description:
      'Free, privacy-first browser tools for images and PDFs. Files stay on your device.',
    canonical: `${SITE_URL}/tools`,
    ogImage: `${SITE_URL}/images/logo.png`,
    ogType: 'website',
  },
  '/about': {
    title: 'About AHADEX Tools - Privacy-First File Tools',
    description:
      'Learn about AHADEX Tools: free, privacy-first, browser-based file utilities. Files stay on your device.',
    canonical: `${SITE_URL}/about`,
    ogImage: `${SITE_URL}/images/logo.png`,
    ogType: 'website',
  },
  '/contact': {
    title: 'Contact AHADEX Tools',
    description: 'Questions, feedback or bug reports? Get in touch with AHADEX Tools.',
    canonical: `${SITE_URL}/contact`,
    ogImage: `${SITE_URL}/images/logo.png`,
    ogType: 'website',
  },
  '/privacy': {
    title: 'Privacy Policy - AHADEX Tools',
    description:
      'How AHADEX Tools handles your data. All file processing happens locally in your browser.',
    canonical: `${SITE_URL}/privacy`,
    ogImage: `${SITE_URL}/images/logo.png`,
    ogType: 'website',
  },
  '/terms': {
    title: 'Terms of Service - AHADEX Tools',
    description: 'Terms of Service for using AHADEX Tools.',
    canonical: `${SITE_URL}/terms`,
    ogImage: `${SITE_URL}/images/logo.png`,
    ogType: 'website',
  },
  '/disclaimer': {
    title: 'Disclaimer - AHADEX Tools',
    description: 'Disclaimer for AHADEX Tools.',
    canonical: `${SITE_URL}/disclaimer`,
    ogImage: `${SITE_URL}/images/logo.png`,
    ogType: 'website',
  },
  '/cookies': {
    title: 'Cookie Policy - AHADEX Tools',
    description: 'How AHADEX Tools uses cookies and how to control them.',
    canonical: `${SITE_URL}/cookies`,
    ogImage: `${SITE_URL}/images/logo.png`,
    ogType: 'website',
  },
};

export async function run(): Promise<void> {
  logger.heading('Generating metadata bundle');

  const { tools } = await discoverTools();
  const liveTools = tools.filter((t) => t.manifest.status === 'live');

  const bundle: Record<string, RouteMeta> = { ...STATIC_ROUTES };

  for (const tool of liveTools) {
    const slug = tool.manifest.slug;
    const toolSeo = await import(`../../../src/tools/${slug}/seo.ts`).catch(() => null);
    const toolSchema = await import(`../../../src/tools/${slug}/schema.ts`).catch(() => null);

    const meta = (
      toolSeo as {
        metadata?: { title: string; description: string; path: string; image?: string };
      } | null
    )?.metadata;
    const schemaFn = toolSchema as {
      buildSchema?: (siteUrl: string) => unknown;
      default?: (siteUrl: string) => unknown;
    } | null;
    const jsonLd = schemaFn?.buildSchema
      ? schemaFn.buildSchema(SITE_URL)
      : schemaFn?.default
        ? schemaFn.default(SITE_URL)
        : undefined;

    bundle[tool.manifest.path] = {
      title: meta?.title ?? tool.manifest.title,
      description: meta?.description ?? tool.manifest.description,
      canonical: `${SITE_URL}${tool.manifest.path}`,
      ogImage: meta?.image ? `${SITE_URL}${meta.image}` : `${SITE_URL}/og/${slug}.png`,
      ogType: 'website',
      jsonLd,
    };

    logger.success(`meta: ${tool.manifest.path}`);
  }

  await writeFile(OUTPUT_PATH, JSON.stringify(bundle, null, 2), 'utf8');
  logger.success(`Metadata bundle written: ${Object.keys(bundle).length} routes.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((err) => {
    logger.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
