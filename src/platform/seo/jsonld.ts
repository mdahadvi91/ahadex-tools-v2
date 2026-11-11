/**
 * JSON-LD structured data builders. Only emit types we actually
 * support, with fields required by schema.org.
 */

import { getSiteConfig } from '../../config/site';
import { buildCanonicalUrl } from './canonical';

export interface JsonLdWebSite {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  description: string;
}

export interface JsonLdWebApplication {
  '@context': 'https://schema.org';
  '@type': 'WebApplication';
  name: string;
  url: string;
  description: string;
  applicationCategory: string;
  operatingSystem: string;
  offers: { '@type': 'Offer'; price: string; priceCurrency: string };
}

export function buildWebSiteJsonLd(): JsonLdWebSite {
  const site = getSiteConfig();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: site.url,
    description: site.description,
  };
}

export function buildWebApplicationJsonLd(input: {
  name: string;
  path: string;
  description: string;
  category?: string;
}): JsonLdWebApplication {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: input.name,
    url: buildCanonicalUrl(input.path),
    description: input.description,
    applicationCategory: input.category ?? 'UtilityApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };
}
