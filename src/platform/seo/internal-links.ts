/**
 * Internal link helpers. Ensures only same-origin paths are treated
 * as internal, and normalizes trailing slashes.
 */

import { normalizeUrl } from '../utilities/url-helpers';
import { getSiteConfig } from '../../config/site';

export interface InternalLink {
  label: string;
  href: string;
}

export function isInternalHref(href: string): boolean {
  if (href.startsWith('/')) return true;
  const { url } = getSiteConfig();
  try {
    return new URL(href).origin === new URL(url).origin;
  } catch {
    return false;
  }
}

export function normalizeInternalHref(href: string): string {
  if (!href.startsWith('/')) return href;
  if (href === '/') return '/';
  return normalizeUrl(href);
}

export function filterInternalLinks<T extends { href: string }>(items: readonly T[]): T[] {
  return items.filter((item) => isInternalHref(item.href));
}
