/**
 * SEO metadata for the Image Compressor tool.
 * Consumed by the page metadata builder and by scripts/tasks/seo validators.
 *
 * ogImagePath uses a public path; the actual file lives in
 * src/tools/image-compressor/assets/og-image.png and is copied to
 * public/images/tools/ during build (or served via Vite asset URL).
 */

import type { PageMetadata } from '../../platform/seo/metadata';

export const metadata: PageMetadata = {
  title: 'Image Compressor - Compress JPG, PNG, WebP in Your Browser',
  description:
    'Compress images without uploading. Works on JPG, PNG, WebP, GIF and AVIF. Free, no signup, no tracking. Files stay on your device.',
  path: '/tools/image-compressor',
  ogImage: 'https://ahadex.online/og/image-compressor.png',
  image: '/og/image-compressor.png',

  type: 'website',
  noIndex: false,
};

export const ogImageAlt = 'Image Compressor tool preview showing before and after file sizes';

export default metadata;
