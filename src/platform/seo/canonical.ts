/**
 * Canonical URL building. Uses site URL from config plus route path.
 */

import { getSiteConfig } from '../../config/site';
import { absoluteUrl } from '../utilities/url-helpers';

export function buildCanonicalUrl(path: string): string {
  const { url } = getSiteConfig();
  const normalizedPath = path === '' || path === '/' ? '/' : path;
  return absoluteUrl(url, normalizedPath);
}

export function isCanonical(url: string, path: string): boolean {
  return buildCanonicalUrl(path) === url;
}
