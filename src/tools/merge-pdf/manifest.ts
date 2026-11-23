/**
 * Merge PDF tool manifest.
 */

import type { ToolManifest } from '../../config/tools';

export const manifest: ToolManifest = {
  slug: 'merge-pdf',
  path: '/merge-pdf/',
  title: 'Free Merge PDF - Combine Multiple PDF Files in Your Browser',
  description:
    'Combine multiple PDF documents in any order directly in your browser. Reorder pages, preview page counts, and download locally.',
  indexable: true,
  sitemap: true,
  status: 'live',
  launchOrder: 4,
  requiresConsent: false,
};

export default manifest;
