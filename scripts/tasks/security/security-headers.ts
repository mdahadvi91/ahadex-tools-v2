/**
 * Security headers validator. Ensures public/_headers contains the
 * required headers on all routes and does not contain forbidden
 * insecure directives.
 */

import { readText, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

interface HeaderRequirement {
  header: string;
  requiredOn: 'all' | 'html';
  validate?: (value: string) => string | null;
  hint: string;
}

const REQUIREMENTS: readonly HeaderRequirement[] = [
  {
    header: 'x-content-type-options',
    requiredOn: 'all',
    validate: (v) => (v.trim().toLowerCase() === 'nosniff' ? null : 'must be "nosniff"'),
    hint: 'Prevents MIME sniffing.',
  },
  {
    header: 'x-frame-options',
    requiredOn: 'all',
    validate: (v) => (v.trim().toUpperCase() === 'DENY' ? null : 'must be "DENY"'),
    hint: 'Prevents clickjacking.',
  },
  {
    header: 'referrer-policy',
    requiredOn: 'all',
    validate: (v) =>
      /strict-origin-when-cross-origin|no-referrer|same-origin/i.test(v)
        ? null
        : 'must be strict-origin-when-cross-origin, no-referrer or same-origin',
    hint: 'Limits referrer data leakage.',
  },
  {
    header: 'permissions-policy',
    requiredOn: 'all',
    hint: 'Restricts powerful browser features (camera, microphone, geolocation).',
  },
  {
    header: 'strict-transport-security',
    requiredOn: 'all',
    validate: (v) =>
      /max-age=\d{6,}/i.test(v) ? null : 'must include max-age of at least 6 digits',
    hint: 'Forces HTTPS for future requests.',
  },
];

function parseHeadersFile(content: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    if (trimmed.endsWith(':') || trimmed.startsWith('/')) continue;
    const colon = trimmed.indexOf(':');
    if (colon === -1) continue;
    const name = trimmed.slice(0, colon).trim().toLowerCase();
    const value = trimmed.slice(colon + 1).trim();
    if (!map.has(name)) map.set(name, value);
  }
  return map;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  if (!(await pathExists(PATHS.publicHeaders))) {
    return [
      error('missing-headers-file', 'public/_headers is missing.', {
        file: 'public/_headers',
        hint: 'Add a _headers file for Cloudflare Pages security headers.',
      }),
    ];
  }

  const content = await readText(PATHS.publicHeaders);
  const headers = parseHeadersFile(content);

  for (const req of REQUIREMENTS) {
    const value = headers.get(req.header);
    if (value === undefined) {
      violations.push(
        error('missing-header', `Missing required header "${req.header}".`, {
          file: 'public/_headers',
          hint: req.hint,
        }),
      );
      continue;
    }
    if (req.validate) {
      const problem = req.validate(value);
      if (problem) {
        violations.push(
          error(
            'invalid-header-value',
            `Header "${req.header}" is invalid: ${problem}.`,
            { file: 'public/_headers', hint: `Got: "${value}"` },
          ),
        );
      }
    }
  }

  // Forbidden insecure directives.
  if (/\bunsafe-eval\b/i.test(content)) {
    violations.push(
      error('unsafe-eval', 'Content-Security-Policy must not allow "unsafe-eval".', {
        file: 'public/_headers',
      }),
    );
  }

  if (/access-control-allow-origin\s*:\s*\*/i.test(content)) {
    violations.push(
      warning(
        'wildcard-cors',
        'Access-Control-Allow-Origin is "*". Confirm this is intentional.',
        { file: 'public/_headers' },
      ),
    );
  }

  return violations;
}
