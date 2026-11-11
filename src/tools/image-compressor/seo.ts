/**
 * SEO metadata for the Image Compressor tool. Consumed by the page
 * metadata builder and by scripts/tasks/seo validators.
 */

import type { PageMetadata } from '../../platform/seo/metadata';

export const metadata: PageMetadata = {
  title: 'Image Compressor - Compress JPG, PNG, WebP in Your Browser',
  description:
    'Compress images without uploading. Works on JPG, PNG, WebP, GIF and AVIF. Free, no signup, no tracking. Files stay on your device.',
  path: '/tools/image-compressor',
  image: '/images/tools/image-compressor-og.png',
  type: 'website',
  noIndex: false,
};

export const ogImageAlt =
  'Image Compressor tool preview showing before and after file sizes';

export default metadata;
