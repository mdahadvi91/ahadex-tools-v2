/**
 * Authoritative enterprise metadata export for Merge PDF.
 */

import type { ToolMetadata } from '../../types/tool';
import { keywords } from './keywords';
import { manifest } from './manifest';

export const metadata: ToolMetadata = {
  slug: manifest.slug,
  name: 'Merge PDF',
  title: manifest.title,
  description: manifest.description,
  keywords: [keywords.primary, ...keywords.secondary, ...keywords.longTail],
  category: 'pdf',
  canonical: `https://ahadex.online${manifest.path}`,
  status: manifest.status,
  indexable: manifest.indexable,
  sitemap: manifest.sitemap,
  launchOrder: manifest.launchOrder,
  featured: true,
  requiresConsent: manifest.requiresConsent,
  supportedFormats: ['PDF'],
  iconPath: '/src/tools/merge-pdf/assets/tool-icon.svg',
  ogImagePath: '/src/tools/merge-pdf/assets/og-image.png',
};

export default metadata;
