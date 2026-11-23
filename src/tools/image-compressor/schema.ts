/**
 * JSON-LD structured data for the Image Compressor tool page.
 * Only facts declared in manifest.ts, content.ts and engine code
 * are included. Nothing here is speculative.
 */

import { FAQ } from './content';

export interface JsonLdGraph {
  '@context': 'https://schema.org';
  '@graph': ReadonlyArray<Record<string, unknown>>;
}

export function buildSchema(siteUrl: string): JsonLdGraph {
  const cleanOrigin = siteUrl.replace(/\/+$/, '');
  const pageUrl = `${cleanOrigin}/image-compressor/`;

  const webApp = {
    '@type': 'WebApplication',
    '@id': `${pageUrl}#app`,
    name: 'Image Compressor',
    description:
      'Free browser-based image compressor for JPG, PNG, WebP, GIF and AVIF. Files never leave your device.',
    url: pageUrl,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires a modern browser with Canvas support.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    featureList: [
      'Compress JPG, PNG, WebP, GIF and AVIF images',
      'Adjustable compression quality',
      'Choose output format (JPEG, WebP, PNG)',
      'No signup required',
      'Files processed locally in the browser',
    ],
  };

  const faqPage = {
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    mainEntity: FAQ.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${cleanOrigin}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Image Compressor',
        item: pageUrl,
      },
    ],
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [webApp, faqPage, breadcrumb],
  };
}

export default buildSchema;
