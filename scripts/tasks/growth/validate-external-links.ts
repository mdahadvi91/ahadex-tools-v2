/**
 * External links validator. Ensures external links are:
 *   - HTTPS (not HTTP)
 *   - Have rel="noopener noreferrer" target="_blank"
 *   - Point to known trustworthy domains
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

function lineNumberAt(source: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const files = await walkFiles(PATHS.src, { extensions: ['.ts', '.tsx'] });

  for (const file of files) {
    const relPath = file.substring(PATHS.root.length + 1).split('\\').join('/');
    if (relPath.endsWith('.test.ts') || relPath.endsWith('.test.tsx')) continue;

    const src = await readText(file);

    // Rule 1: no HTTP links.
    const httpRe = /['"]http:\/\/[^'"]+['"]/g;
    let m: RegExpExecArray | null;
    while ((m = httpRe.exec(src)) !== null) {
      violations.push(
        error(
          'insecure-external-link',
          'External link uses HTTP (should be HTTPS).',
          {
            file: relPath,
            line: lineNumberAt(src, m.index),
            hint: 'All external links must use HTTPS.',
          },
        ),
      );
    }

    // Rule 2: target="_blank" without rel="noopener".
    const targetBlankRe = /<a\b[^>]*\btarget\s*=\s*['"]_blank['"][^>]*>/g;
    while ((m = targetBlankRe.exec(src)) !== null) {
      const tag = m[0];
      if (!/rel\s*=\s*['"][^'"]*noopener/.test(tag)) {
        violations.push(
          error(
            'target-blank-no-noopener',
            'target="_blank" without rel="noopener" (tabnabbing risk).',
            {
              file: relPath,
              line: lineNumberAt(src, m.index),
            },
          ),
        );
      }
    }

    // Rule 3: warn on suspicious external URLs.
    const urlRe = /['"]https:\/\/([^/'"`]+)[^'"]*['"]/g;
    while ((m = urlRe.exec(src)) !== null) {
      const host = m[1];
      // Skip well-known domains.
      const trusted = [
        'schema.org', 'www.w3.org', 'w3.org', 'developer.mozilla.org',
        'mdn.mozilla.org', 'developers.google.com', 'web.dev',
        'webassembly.org', 'react.dev', 'vitejs.dev', 'tailwindcss.com',
        'typescriptlang.org', 'github.com', 'npmjs.com',
        'google-analytics.com', 'googletagmanager.com',
        'ahadex.online',
      ];
      if (!trusted.some((t) => host === t || host.endsWith(`.${t}`))) {
        violations.push(
          warning(
            'unrecognized-external-domain',
            `External domain "${host}" not in trusted list.`,
            {
              file: relPath,
              line: lineNumberAt(src, m.index),
              hint: 'Add to trusted list in this validator if intentional.',
            },
          ),
        );
      }
    }
  }

  return violations;
}
