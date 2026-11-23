/**
 * JSON-LD structured data for the PDF Compressor tool page.
 */

import { FAQ } from './content';

export interface JsonLdGraph {
  '@context': 'https://schema.org';
  '@graph': ReadonlyArray<Record<string, unknown>>;
}

export function buildSchema(siteUrl: string): JsonLdGraph {
  const cleanOrigin = siteUrl.replace(/\/+$/, '');
  const pageUrl = `${cleanOrigin}/pdf-compressor/`;

  const webApp = {
    '@type': 'WebApplication',
    '@id': `${pageUrl}#app`,
    name: 'PDF Compressor',
    description:
      'Free browser-based PDF compressor that optimizes object streams and strips optional metadata locally without file uploads.',
    url: pageUrl,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires a modern browser with Web File API support.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    featureList: [
      'Compress PDF object streams locally',
      'Optional document metadata removal',
      'Batch optimization for multiple PDFs',
      'Preserves text and vector clarity',
      'Zero server uploads and no signup',
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
        name: 'PDF Compressor',
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
