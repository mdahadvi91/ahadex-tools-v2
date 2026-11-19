/**
 * Twitter Card tag builder.
 */

import { getSiteConfig } from '../../config/site';
import { normalizeMetadata, type PageMetadata } from './metadata';

export interface TwitterCardTags {
  'twitter:card': 'summary' | 'summary_large_image';
  'twitter:title': string;
  'twitter:description': string;
  'twitter:image'?: string;
  'twitter:site'?: string;
}

export function buildTwitterCardTags(meta: PageMetadata): TwitterCardTags {
  const site = getSiteConfig();
  const normalized = normalizeMetadata(meta);
  const tags: TwitterCardTags = {
    'twitter:card': meta.ogImage ? 'summary_large_image' : 'summary',
    'twitter:title': normalized.title,
    'twitter:description': normalized.description,
  };
  if (meta.ogImage) tags['twitter:image'] = meta.ogImage;
  if (site.twitterHandle) tags['twitter:site'] = site.twitterHandle;
  return tags;
}
