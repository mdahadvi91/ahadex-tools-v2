/**
 * JSON-LD structured data for the Split PDF tool page.
 */

import { FAQ } from './content';

export interface JsonLdGraph {
  '@context': 'https://schema.org';
  '@graph': ReadonlyArray<Record<string, unknown>>;
}

export function buildSchema(siteUrl: string): JsonLdGraph {
  const cleanOrigin = siteUrl.replace(/\/+$/, '');
  const pageUrl = `${cleanOrigin}/split-pdf/`;

  const webApp = {
    '@type': 'WebApplication',
    '@id': `${pageUrl}#app`,
    name: 'Split PDF',
    description:
      'Free browser-based utility to extract custom page ranges or split every PDF page into separate documents locally without uploads.',
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
      'Extract custom page ranges (e.g. 1-3, 5)',
      'Split every page into individual PDFs',
      'Instant page count detection',
      'Lossless text and vector preservation',
      'Zero uploads, zero watermarks, no signup',
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
        name: 'Split PDF',
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
