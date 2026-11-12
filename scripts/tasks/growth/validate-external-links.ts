/**
 * External links validator. Ensures external links are HTTPS
 * (allowing localhost for dev-only), and target="_blank" has
 * rel="noopener".
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

const TRUSTED_DOMAINS = [
  'schema.org', 'www.w3.org', 'w3.org',
  'developer.mozilla.org', 'developers.google.com',
  'web.dev', 'webassembly.org',
  'react.dev', 'vitejs.dev', 'tailwindcss.com',
  'typescriptlang.org', 'github.com', 'npmjs.com',
  'google-analytics.com', 'googletagmanager.com',
  'ahadex.online',
];

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];
  const files = await walkFiles(PATHS.src, { extensions: ['.ts', '.tsx'] });

  for (const file of files) {
    const relPath = file.substring(PATHS.root.length + 1).split('\\').join('/');
    if (relPath.endsWith('.test.ts') || relPath.endsWith('.test.tsx')) continue;

    const src = await readText(file);

    const httpRe = /['"]http:\/\/([^'"]+)['"]/g;
    let m: RegExpExecArray | null;
    while ((m = httpRe.exec(src)) !== null) {
      const host = m[1].split('/')[0].split(':')[0];
      if (host === 'localhost' || host === '127.0.0.1') continue;

      violations.push(
        error('insecure-external-link', 'External link uses HTTP (should be HTTPS).', {
          file: relPath,
          line: lineNumberAt(src, m.index),
        }),
      );
      if (m.index === httpRe.lastIndex) httpRe.lastIndex += 1;
    }

    const targetBlankRe = /<a\b[^>]*\btarget\s*=\s*['"]_blank['"][^>]*>/g;
    while ((m = targetBlankRe.exec(src)) !== null) {
      const tag = m[0];
      if (!/rel\s*=\s*['"][^'"]*noopener/.test(tag)) {
        violations.push(
          error(
            'target-blank-no-noopener',
            'target="_blank" without rel="noopener" (tabnabbing risk).',
            { file: relPath, line: lineNumberAt(src, m.index) },
          ),
        );
      }
      if (m.index === targetBlankRe.lastIndex) targetBlankRe.lastIndex += 1;
    }

    const urlRe = /['"]https:\/\/([^/'"]+)[^'"]*['"]/g;
    while ((m = urlRe.exec(src)) !== null) {
      const host = m[1];
      if (!TRUSTED_DOMAINS.some((t) => host === t || host.endsWith('.' + t))) {
        violations.push(
          warning(
            'unrecognized-external-domain',
            'External domain "' + host + '" not in trusted list.',
            { file: relPath, line: lineNumberAt(src, m.index) },
          ),
        );
      }
      if (m.index === urlRe.lastIndex) urlRe.lastIndex += 1;
    }
  }

  return violations;
}
