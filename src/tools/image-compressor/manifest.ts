/**
 * Image Compressor tool manifest. Single source of truth for route
 * discovery and launch state.
 */

import type { ToolManifest } from '../../config/tools';

export const manifest: ToolManifest = {
  slug: 'image-compressor',
  path: '/image-compressor/',
  title: 'Free Image Compressor - Compress JPG, PNG, WebP Without Uploading',
  description:
    'Compress JPG, PNG, WebP, GIF and AVIF images in your browser. Your files never leave your device. No signup, no upload, no tracking.',
  indexable: true,
  sitemap: true,
  status: 'live',
  launchOrder: 1,
  requiresConsent: false,
};

export default manifest;
