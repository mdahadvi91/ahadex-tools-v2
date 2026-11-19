/**
 * Image Resizer tool manifest. Single source of truth for route,
 * SEO metadata and launch state.
 */

import type { ToolManifest } from '../../config/tools';

export const manifest: ToolManifest = {
  slug: 'image-resizer',
  path: '/tools/image-resizer',
  title: 'Free Image Resizer - Resize JPG, PNG, WebP Without Uploading',
  description:
    'Resize JPG, PNG, WebP, GIF and AVIF images to exact pixel dimensions in your browser. Your files never leave your device. No signup, no tracking.',
  indexable: true,
  sitemap: true,
  status: 'live',
  launchOrder: 2,
  requiresConsent: false,
};

export default manifest;
