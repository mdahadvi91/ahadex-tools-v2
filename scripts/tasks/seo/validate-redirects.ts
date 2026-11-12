/**
 * Redirects validator. Ensures public/_redirects is well-formed and
 * every redirect points to a valid target:
 *   - Format: "from to status" per line
 *   - Status codes in the allowed set (301, 302, 303, 307, 308, 200)
 *   - Source paths must start with /
 *   - Destination paths must exist or be a valid SPA fallback
 */

import { readText, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { discoverTools } from '../../utils/route-discovery';
import { error, warning, type Violation } from '../../utils/validation-result';

const VALID_STATUS_CODES = new Set([200, 301, 302, 303, 307, 308]);

const STATIC_ROUTES = new Set([
  '/',
  '/tools',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/disclaimer',
  '/cookies',
  '/index.html',
]);

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  if (!(await pathExists(PATHS.publicRedirects))) {
    return [
      error('redirects-missing', 'public/_redirects is missing.', {
        file: 'public/_redirects',
      }),
    ];
  }

  const content = await readText(PATHS.publicRedirects);
  const { tools } = await discoverTools();
  const toolPaths = new Set(tools.map((t) => t.manifest.path));

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) continue;

    const parts = line.split(/\s+/);
    if (parts.length < 2) {
      violations.push(
        error('redirect-malformed', `Line ${i + 1}: expected "from to [status]".`, {
          file: 'public/_redirects',
          line: i + 1,
        }),
      );
      continue;
    }

    const [from, to, statusStr] = parts;

    if (!from.startsWith('/')) {
      violations.push(
        error('redirect-from-invalid', `Line ${i + 1}: source "${from}" must start with /.`, {
          file: 'public/_redirects',
          line: i + 1,
        }),
      );
    }

    if (statusStr !== undefined) {
      const status = parseInt(statusStr, 10);
      if (Number.isNaN(status) || !VALID_STATUS_CODES.has(status)) {
        violations.push(
          warning(
            'redirect-status-invalid',
            `Line ${i + 1}: status "${statusStr}" is not a standard code.`,
            { file: 'public/_redirects', line: i + 1 },
          ),
        );
      }
    }

    // Destination must be a valid static route, tool path, or file.
    const cleanTo = to.replace(/\/+$/, '') || '/';
    const isStatic = STATIC_ROUTES.has(cleanTo);
    const isTool = toolPaths.has(cleanTo);
    const isFile = /\.(html|xml|txt|json|png|jpg|svg|ico|webp|webmanifest)$/i.test(cleanTo);
    const isExternal = /^https?:\/\//.test(cleanTo);

    if (!isStatic && !isTool && !isFile && !isExternal && cleanTo !== '/') {
      violations.push(
        warning(
          'redirect-target-unknown',
          `Line ${i + 1}: target "${to}" does not match a known route.`,
          {
            file: 'public/_redirects',
            line: i + 1,
            hint: 'Verify the target exists or is a valid fallback.',
          },
        ),
      );
    }
  }

  return violations;
}
