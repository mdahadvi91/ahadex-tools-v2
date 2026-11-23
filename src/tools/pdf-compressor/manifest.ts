/**
 * PDF Compressor tool manifest. Single source of truth for route
 * discovery and launch state.
 */

import type { ToolManifest } from '../../config/tools';

export const manifest: ToolManifest = {
  slug: 'pdf-compressor',
  path: '/pdf-compressor/',
  title: 'Free PDF Compressor - Optimize PDF Size in Your Browser',
  description:
    'Optimize and shrink PDF files locally in your browser. Strip metadata and compress object streams with no server upload or signup.',
  indexable: true,
  sitemap: true,
  status: 'live',
  launchOrder: 3,
  requiresConsent: false,
};

export default manifest;
