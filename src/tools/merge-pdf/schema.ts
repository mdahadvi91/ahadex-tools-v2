/**
 * JSON-LD structured data for the Merge PDF tool page.
 */

import { FAQ } from './content';

export interface JsonLdGraph {
  '@context': 'https://schema.org';
  '@graph': ReadonlyArray<Record<string, unknown>>;
}

export function buildSchema(siteUrl: string): JsonLdGraph {
  const cleanOrigin = siteUrl.replace(/\/+$/, '');
  const pageUrl = `${cleanOrigin}/merge-pdf/`;

  const webApp = {
    '@type': 'WebApplication',
    '@id': `${pageUrl}#app`,
    name: 'Merge PDF',
    description:
      'Free browser-based tool to combine and reorder multiple PDF files locally on your device without server uploads.',
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
      'Combine 2 to 20 PDF documents locally',
      'Reorder documents prior to merging',
      'Custom output filename support',
      'Preserves text and vector fidelity',
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
        name: 'Merge PDF',
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
