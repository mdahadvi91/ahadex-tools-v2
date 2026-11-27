/**
 * CV Maker tool manifest.
 */

import type { ToolManifest } from '../../config/tools';

export const manifest: ToolManifest = {
  slug: 'cv-maker',
  path: '/cv-maker/',
  title: 'Free CV Maker - Build & Export Custom PDF Resumes in Browser',
  description:
    'Build a tailored resume from 30 unique templates and profession presets in your browser. Edit step by step and download PDF locally with zero upload.',
  indexable: true,
  sitemap: true,
  status: 'live',
  launchOrder: 6,
  requiresConsent: false,
};

export default manifest;
