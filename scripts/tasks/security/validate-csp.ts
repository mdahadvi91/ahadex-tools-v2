/**
 * Content Security Policy validator. Checks that the CSP emitted
 * by src/platform/security/content-security.ts is present in
 * public/_headers and uses safe directives.
 */

import { readText, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

const FORBIDDEN_SCRIPT_SOURCES = ["'unsafe-eval'", "'unsafe-inline'", 'http:', 'https://*'];

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  if (!(await pathExists(PATHS.publicHeaders))) {
    return [
      error('missing-headers-file', 'public/_headers is missing.', {
        file: 'public/_headers',
      }),
    ];
  }

  const content = await readText(PATHS.publicHeaders);
  const cspMatch = content.match(/content-security-policy\s*:\s*([^\n]+)/i);

  if (!cspMatch) {
    return [
      error('missing-csp', 'Content-Security-Policy header is missing.', {
        file: 'public/_headers',
        hint: 'Add a CSP that mirrors src/platform/security/content-security.ts.',
      }),
    ];
  }

  const csp = cspMatch[1].trim();
  const directives = new Map<string, string>();
  for (const part of csp.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const [name, ...rest] = trimmed.split(/\s+/);
    directives.set(name.toLowerCase(), rest.join(' '));
  }

  // default-src is required.
  if (!directives.has('default-src')) {
    violations.push(
      error('csp-missing-default', 'CSP must define default-src.', {
        file: 'public/_headers',
      }),
    );
  }

  // object-src must be 'none'.
  const objectSrc = directives.get('object-src');
  if (!objectSrc || !objectSrc.includes("'none'")) {
    violations.push(
      error('csp-object-src', "CSP object-src must be 'none'.", {
        file: 'public/_headers',
      }),
    );
  }

  // base-uri should be 'self'.
  const baseUri = directives.get('base-uri');
  if (!baseUri || baseUri.trim() !== "'self'") {
    violations.push(
      warning('csp-base-uri', "CSP base-uri should be 'self'.", {
        file: 'public/_headers',
      }),
    );
  }

  // frame-ancestors must be 'none' (defense in depth).
  const frameAncestors = directives.get('frame-ancestors');
  if (!frameAncestors || frameAncestors.trim() !== "'none'") {
    violations.push(
      warning('csp-frame-ancestors', "CSP frame-ancestors should be 'none'.", {
        file: 'public/_headers',
      }),
    );
  }

  // script-src must not contain forbidden sources.
  const scriptSrc = directives.get('script-src');
  if (scriptSrc) {
    for (const forbidden of FORBIDDEN_SCRIPT_SOURCES) {
      if (scriptSrc.includes(forbidden)) {
        violations.push(
          error(
            'csp-script-src-forbidden',
            `script-src contains forbidden source "${forbidden}".`,
            {
              file: 'public/_headers',
              hint: "Remove 'unsafe-eval'/'unsafe-inline' or wildcard hosts.",
            },
          ),
        );
      }
    }
  }

  // Must include worker-src for Web Workers.
  if (!directives.has('worker-src')) {
    violations.push(
      warning('csp-missing-worker-src', 'CSP should declare worker-src (Web Workers).', {
        file: 'public/_headers',
      }),
    );
  }

  return violations;
}
