/**
 * Open Graph tag builder.
 */

import { getSiteConfig } from '../../config/site';
import { buildCanonicalUrl } from './canonical';
import { normalizeMetadata, type PageMetadata } from './metadata';

export interface OpenGraphTags {
  'og:type': string;
  'og:title': string;
  'og:description': string;
  'og:url': string;
  'og:site_name': string;
  'og:locale': string;
  'og:image'?: string;
}

export function buildOpenGraphTags(meta: PageMetadata): OpenGraphTags {
  const site = getSiteConfig();
  const normalized = normalizeMetadata(meta);
  const tags: OpenGraphTags = {
    'og:type': meta.type ?? 'website',
    'og:title': normalized.title,
    'og:description': normalized.description,
    'og:url': buildCanonicalUrl(meta.path),
    'og:site_name': site.name,
    'og:locale': site.locale,
  };
  if (meta.ogImage) {
    tags['og:image'] = meta.ogImage;
  }
  return tags;
}
