/**
 * Content Security Policy strings for static headers and meta tags.
 * Values are placeholders until deployment config is finalized.
 */

export interface CspDirectives {
  [directive: string]: readonly string[];
}

const SELF = "'self'";

export const BASE_CSP: CspDirectives = Object.freeze({
  'default-src': [SELF],
  'script-src': [SELF, "'strict-dynamic'"],
  'style-src': [SELF, "'unsafe-inline'"],
  'img-src': [SELF, 'data:', 'blob:'],
  'font-src': [SELF, 'data:'],
  'connect-src': [SELF],
  'worker-src': [SELF, 'blob:'],
  'manifest-src': [SELF],
  'object-src': ["'none'"],
  'base-uri': [SELF],
  'form-action': [SELF],
  'frame-ancestors': ["'none'"],
});

/**
 * Renders a CSP directive map into a header value string.
 */
export function serializeCsp(directives: CspDirectives): string {
  return Object.entries(directives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

export const CSP_HEADER_VALUE = serializeCsp(BASE_CSP);
