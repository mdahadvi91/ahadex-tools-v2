/**
 * Authoritative enterprise metadata export for CV Maker.
 */

import type { ToolMetadata } from '../../types/tool';
import { keywords } from './keywords';
import { manifest } from './manifest';

export const metadata: ToolMetadata = {
  slug: manifest.slug,
  name: 'CV Maker',
  title: manifest.title,
  description: manifest.description,
  keywords: [keywords.primary, ...keywords.secondary, ...keywords.longTail],
  category: 'document',
  canonical: `https://ahadex.online${manifest.path}`,
  status: manifest.status,
  indexable: manifest.indexable,
  sitemap: manifest.sitemap,
  launchOrder: manifest.launchOrder,
  featured: true,
  requiresConsent: manifest.requiresConsent,
  supportedFormats: ['PDF', 'JPG', 'PNG', 'WebP'],
  iconPath: '/src/tools/cv-maker/assets/tool-icon.svg',
  ogImagePath: '/src/tools/cv-maker/assets/og-image.png',
};

export default metadata;
