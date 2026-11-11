/**
 * URL building and normalization helpers.
 */

/**
 * Joins a base URL and a path with exactly one slash between them.
 * Does not modify the base's scheme, host, or query. Preserves the
 * base's trailing state only when path is empty.
 */
export function joinUrl(base: string, path: string): string {
  if (path === '') return base;
  const trimmedBase = base.replace(/\/+$/, '');
  const trimmedPath = path.replace(/^\/+/, '');
  return `${trimmedBase}/${trimmedPath}`;
}

/**
 * Removes a trailing slash from a URL, unless the URL is just a
 * scheme + host + slash (e.g. "https://example.com/") in which case
 * the slash is kept to avoid producing "https://example.com".
 */
export function normalizeUrl(url: string): string {
  if (!url.endsWith('/')) return url;
  try {
    const parsed = new URL(url);
    if (parsed.pathname === '/' && !parsed.search && !parsed.hash) {
      return url;
    }
    return url.replace(/\/+$/, '');
  } catch {
    return url.replace(/\/+$/, '');
  }
}

/**
 * Builds an absolute URL from a base and path. Returns the path
 * unchanged if it is already absolute (has a scheme).
 */
export function absoluteUrl(base: string, path: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return path;
  return joinUrl(base, path);
}

/**
 * Returns true if the URL has a scheme and host (e.g. "https://x.com/y").
 */
export function isExternalUrl(url: string): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(url);
}

/**
 * Returns true if `url` has the same origin as `base`. Both must be
 * absolute URLs for a meaningful result; relative `url` is treated as
 * same-origin.
 */
export function isSameOrigin(url: string, base: string): boolean {
  if (!isExternalUrl(url)) return true;
  try {
    return new URL(url).origin === new URL(base).origin;
  } catch {
    return false;
  }
}
