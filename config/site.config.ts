/**
 * Root site configuration for AHADEX Tools.
 * Defines the authoritative primary domain, trailing-slash canonical policy,
 * brand identity, and static informational page routes.
 *
 * NOTE: Tools are NEVER registered here. Tools are discovered exclusively via
 * filesystem scanning of src/tools/[slug]/index.ts.
 */

export const SITE_CONFIG = {
  name: 'AHADEX Tools',
  shortName: 'AHADEX',
  tagline: 'Fast, Privacy-First Browser Utilities',
  domain: 'ahadex.online',
  origin: 'https://ahadex.online',
  trailingSlash: true,
  defaultLocale: 'en',
  contactEmail: 'contact@ahadex.online',
  repository: 'https://github.com/mdahadvi91/ahadex-tools-v2',
  indexNowKey: '8f4c2e19a7b34d6e9012f5a8c3d7e4b1',
} as const;

import { STATIC_PAGE_ROUTES, type StaticPageRouteConfig } from '../src/config/static-routes';

export { STATIC_PAGE_ROUTES, type StaticPageRouteConfig };

/**
 * Normalizes a route path according to the trailing-slash URL strategy.
 * Root remains "/", and all non-root paths begin and end with "/".
 */
export function normalizeRoutePath(routePath: string): string {
  const trimmed = routePath.trim();
  if (trimmed === '' || trimmed === '/') {
    return '/';
  }
  const withoutSlashes = trimmed.replace(/^\/+|\/+$/g, '');
  return `/${withoutSlashes}/`;
}

/**
 * Builds an absolute canonical URL on the primary production origin.
 */
export function buildCanonicalUrl(routePath: string, origin: string = SITE_CONFIG.origin): string {
  const cleanOrigin = origin.replace(/\/+$/, '');
  const normalized = normalizeRoutePath(routePath);
  return `${cleanOrigin}${normalized}`;
}
