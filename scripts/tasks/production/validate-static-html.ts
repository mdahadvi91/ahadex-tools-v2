/**
 * Static HTML validator. Ensures dist/index.html has all required
 * head elements and meta tags.
 */

import { join } from 'node:path';
import { readText, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const indexPath = join(PATHS.dist, 'index.html');
  if (!(await pathExists(indexPath))) {
    return [
      error('dist-html-missing', 'dist/index.html is missing.', {
        file: 'dist/index.html',
        hint: 'Run `npm run build` first.',
      }),
    ];
  }

  const html = await readText(indexPath);

  // Rule 1: required meta tags.
  const required = [
    { name: 'charset', pattern: /<meta\s+charset=/i },
    { name: 'viewport', pattern: /<meta\s+name=["']viewport["']/i },
    { name: 'title', pattern: /<title>[^<]+<\/title>/i },
    { name: 'description', pattern: /<meta\s+name=["']description["']/i },
    { name: 'lang attribute', pattern: /<html\b[^>]*\blang\s*=/i },
  ];

  for (const req of required) {
    if (!req.pattern.test(html)) {
      violations.push(
        warning(
          'html-missing-' + req.name.replace(/\s+/g, '-'),
          'dist/index.html is missing ' + req.name + '.',
          { file: 'dist/index.html' },
        ),
      );
    }
  }

  // Rule 2: manifest link.
  if (!/<link\s+rel=["']manifest["']/.test(html)) {
    violations.push(
      warning('html-no-manifest', 'dist/index.html has no manifest link.', {
        file: 'dist/index.html',
      }),
    );
  }

  // Rule 3: no external synchronous scripts.
  const externalRe =
    /<script\b(?![^>]*\b(?:async|defer|type=["']module["']))[^>]*src=["']https?:\/\/[^'"]+["']/g;
  const externalCount = (html.match(externalRe) ?? []).length;
  if (externalCount > 0) {
    violations.push(
      error(
        'external-sync-script',
        'External script loaded synchronously: ' + externalCount + ' instance(s).',
        {
          file: 'dist/index.html',
          hint: 'Use async, defer, or load from a component after consent.',
        },
      ),
    );
  }

  // Rule 4: no inline event handlers.
  const inlineRe = /\bon(?:click|load|error|change|submit)\s*=/g;
  const inlineCount = (html.match(inlineRe) ?? []).length;
  if (inlineCount > 0) {
    violations.push(
      warning('inline-handler', 'Inline event handler in HTML (' + inlineCount + ' instances).', {
        file: 'dist/index.html',
      }),
    );
  }

  return violations;
}
