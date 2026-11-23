/**
 * Split PDF tool manifest.
 */

import type { ToolManifest } from '../../config/tools';

export const manifest: ToolManifest = {
  slug: 'split-pdf',
  path: '/split-pdf/',
  title: 'Free Split PDF - Extract Pages & Split PDFs in Your Browser',
  description:
    'Extract specific PDF page ranges or burst pages into separate PDFs directly in your browser. Zero uploads, zero signup, instant save.',
  indexable: true,
  sitemap: true,
  status: 'live',
  launchOrder: 5,
  requiresConsent: false,
};

export default manifest;
