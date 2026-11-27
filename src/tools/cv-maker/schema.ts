/**
 * JSON-LD structured data for the CV Maker tool page.
 */

import { FAQ } from './content';

export interface JsonLdGraph {
  '@context': 'https://schema.org';
  '@graph': ReadonlyArray<Record<string, unknown>>;
}

export function buildSchema(siteUrl: string): JsonLdGraph {
  const cleanOrigin = siteUrl.replace(/\/+$/, '');
  const pageUrl = `${cleanOrigin}/cv-maker/`;

  const webApp = {
    '@type': 'WebApplication',
    '@id': `${pageUrl}#app`,
    name: 'CV Maker',
    description:
      'Free browser-based CV and resume builder featuring 30 unique design templates, profession-specific starter content, step-by-step editing, and instant local PDF export.',
    url: pageUrl,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires a modern browser with JavaScript and Blob download support.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    featureList: [
      '30 unique visual CV templates across 10 layout archetypes',
      '12 curated profession presets with editable summary, experience, and education',
      'Step-by-step interactive editor with optional portrait photo support',
      'Real vector A4 PDF export locally in browser via pdf-lib',
      'Zero server uploads, zero watermarks, no signup required',
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
        name: 'CV Maker',
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
