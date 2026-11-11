/**
 * Redirect chains validator. Detects redirects that point to another
 * redirect (chains), which slow page loads and dilute link equity:
 *   - A -> B where B -> C should be flattened to A -> C
 *   - Redirect loops (A -> B -> A) must be reported as errors
 *
 * Also detects redirects that point to the canonical URL of the same
 * path (redirect to self), which is a misconfiguration.
 */

import { readText, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

interface Redirect {
  from: string;
  to: string;
  status: number;
  line: number;
}

function parseRedirects(content: string): Redirect[] {
  const out: Redirect[] = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '' || line.startsWith('#')) continue;
    const parts = line.split(/\s+/);
    if (parts.length < 2) continue;
    const status = parts.length >= 3 ? parseInt(parts[2], 10) : 301;
    if (!Number.isFinite(status)) continue;
    if (![301, 302, 303, 307, 308].includes(status)) continue;
    out.push({
      from: parts[0].replace(/\/+$/, '') || '/',
      to: parts[1].replace(/\/+$/, '') || '/',
      status,
      line: i + 1,
    });
  }
  return out;
}

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
  const redirects = parseRedirects(content);

  if (redirects.length === 0) return violations;

  const byFrom = new Map<string, Redirect>();
  for (const r of redirects) {
    if (byFrom.has(r.from)) {
      violations.push(
        error(
          'duplicate-redirect-source',
          `Redirect source "${r.from}" is defined more than once.`,
          { file: 'public/_redirects', line: r.line },
        ),
      );
    }
    byFrom.set(r.from, r);
  }

  for (const redirect of redirects) {
    // Rule 1: redirect to self.
    if (redirect.from === redirect.to) {
      violations.push(
        error(
          'redirect-self',
          `Redirect target equals source: ${redirect.from}.`,
          { file: 'public/_redirects', line: redirect.line },
        ),
      );
      continue;
    }

    // Rule 2: chain detection.
    let current = redirect;
    const chain: string[] = [current.from];
    let hops = 0;
    while (byFrom.has(current.to) && hops < 10) {
      current = byFrom.get(current.to)!;
      chain.push(current.from);
      hops++;
      if (chain[0] === current.to) {
        violations.push(
          error(
            'redirect-loop',
            `Loop detected: ${[...chain, current.to].join(' -> ')}.`,
            { file: 'public/_redirects', line: redirect.line },
          ),
        );
        break;
      }
    }
    if (hops > 0 && chain[0] !== current.to) {
      violations.push(
        warning(
          'redirect-chain',
          `Redirect chain: ${[...chain, current.to].join(' -> ')}.`,
          {
            file: 'public/_redirects',
            line: redirect.line,
            hint: `Flatten by redirecting "${redirect.from}" directly to "${current.to}".`,
          },
        ),
      );
    }
  }

  return violations;
}
