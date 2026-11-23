/**
 * Authoritative enterprise metadata export for PDF Compressor.
 */

import type { ToolMetadata } from '../../types/tool';
import { keywords } from './keywords';
import { manifest } from './manifest';

export const metadata: ToolMetadata = {
  slug: manifest.slug,
  name: 'PDF Compressor',
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
  iconPath: '/src/tools/pdf-compressor/assets/tool-icon.svg',
  ogImagePath: '/src/tools/pdf-compressor/assets/og-image.png',
};

export default metadata;
