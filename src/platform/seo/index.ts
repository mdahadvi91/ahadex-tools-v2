/**
 * Document head metadata synchronization helper.
 */

import { getEnvironment } from '../../config/environment';
import type { RouteMeta } from '../../router/route-types';

export function applyRouteSeo(meta: RouteMeta): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.title = meta.title;

  let descriptionEl = document.querySelector('meta[name="description"]');
  if (!descriptionEl) {
    descriptionEl = document.createElement('meta');
    descriptionEl.setAttribute('name', 'description');
    document.head.appendChild(descriptionEl);
  }
  descriptionEl.setAttribute('content', meta.description);

  const env = getEnvironment();
  if (env.siteUrl) {
    const cleanOrigin = env.siteUrl.replace(/\/+$/, '');
    const normalizedPath = meta.path === '/' ? '/' : `/${meta.path.replace(/^\/+|\/+$/g, '')}/`;
    const canonicalUrl = `${cleanOrigin}${normalizedPath}`;
    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', canonicalUrl);
  }
}
