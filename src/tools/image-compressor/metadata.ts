/**
 * Authoritative enterprise metadata export for Image Compressor.
 */

import type { ToolMetadata } from '../../types/tool';
import { keywords } from './keywords';
import { manifest } from './manifest';

export const metadata: ToolMetadata = {
  slug: manifest.slug,
  name: 'Image Compressor',
  title: manifest.title,
  description: manifest.description,
  keywords: [keywords.primary, ...keywords.secondary, ...keywords.longTail],
  category: 'image',
  canonical: `https://ahadex.online${manifest.path}`,
  status: manifest.status,
  indexable: manifest.indexable,
  sitemap: manifest.sitemap,
  launchOrder: manifest.launchOrder,
  featured: true,
  requiresConsent: manifest.requiresConsent,
  supportedFormats: ['JPG', 'JPEG', 'PNG', 'WebP', 'GIF', 'AVIF'],
  iconPath: '/src/tools/image-compressor/assets/tool-icon.svg',
  ogImagePath: '/src/tools/image-compressor/assets/og-image.png',
};

export default metadata;
