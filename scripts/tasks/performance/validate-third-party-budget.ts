/**
 * Third-party budget validator. Ensures analytics and ads scripts
 * are size-limited and consent-gated:
 *   - GA4 reference exists in analytics adapter only
 *   - AdSense reference exists in adsense adapter only
 *   - No third-party scripts imported directly from source files
 *   - package.json does not pull heavy tracking SDKs
 */

import { join } from 'node:path';
import { readText, walkFiles, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

const GA_DOMAINS = ['googletagmanager.com', 'google-analytics.com'];
const ADSENSE_DOMAINS = ['pagead2.googlesyndication.com', 'googlesyndication.com'];

/** Files allowed to reference third-party domains. */
const ALLOWED_GA_FILES = new Set([
  'src/platform/analytics/adapter.ts',
  'src/platform/analytics/analytics.ts',
]);

const ALLOWED_ADSENSE_FILES = new Set([
  'src/platform/adsense/adapter.ts',
  'src/platform/adsense/adsense.ts',
]);

/** Packages that would add unacceptable bundle weight. */
const HEAVY_PACKAGES = [
  'analytics-node',
  'mixpanel-browser',
  '@amplitude/analytics-browser',
  'react-ga',
  'react-ga4',
  'universal-analytics',
];

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

function lineNumberAt(src: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < src.length; i++) {
    if (src.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  // Rule 1: GA domain only appears in allowed files.
  const sourceFiles = await walkFiles(PATHS.src, { extensions: ['.ts', '.tsx'] });
  for (const file of sourceFiles) {
    const relPath = file
      .replace(PATHS.root + '/', '')
      .split('\\')
      .join('/');
    if (relPath.endsWith('.test.ts') || relPath.endsWith('.test.tsx')) continue;

    const src = await readText(file);

    for (const domain of GA_DOMAINS) {
      const idx = src.indexOf(domain);
      if (idx === -1) continue;
      if (!ALLOWED_GA_FILES.has(relPath)) {
        violations.push(
          error(
            'ga-domain-outside-adapter',
            `GA domain "${domain}" referenced outside analytics adapter.`,
            {
              file: relPath,
              line: lineNumberAt(src, idx),
              hint: 'Analytics domains must be centralized in adapter.ts.',
            },
          ),
        );
      }
    }

    for (const domain of ADSENSE_DOMAINS) {
      const idx = src.indexOf(domain);
      if (idx === -1) continue;
      if (!ALLOWED_ADSENSE_FILES.has(relPath)) {
        violations.push(
          warning(
            'adsense-domain-outside-adapter',
            `AdSense domain "${domain}" referenced outside adsense adapter.`,
            {
              file: relPath,
              line: lineNumberAt(src, idx),
              hint: 'Centralize AdSense integration once the adapter exists.',
            },
          ),
        );
      }
    }
  }

  // Rule 2: no heavy tracking SDKs in package.json.
  const pkgPath = join(PATHS.root, 'package.json');
  if (await pathExists(pkgPath)) {
    const pkgJson = JSON.parse(await readText(pkgPath)) as PackageJson;
    const all = new Set([
      ...Object.keys(pkgJson.dependencies ?? {}),
      ...Object.keys(pkgJson.devDependencies ?? {}),
    ]);
    for (const pkg of HEAVY_PACKAGES) {
      if (all.has(pkg)) {
        violations.push(
          error(
            'heavy-tracking-package',
            `Package "${pkg}" adds significant bundle weight for tracking.`,
            {
              file: 'package.json',
              hint: 'Use the native GA4 snippet in adapter.ts instead.',
            },
          ),
        );
      }
    }
  }

  // Rule 3: no <script src="https://..."> outside index.html.
  const htmlFiles = await walkFiles(PATHS.root, { extensions: ['.html'] });
  for (const file of htmlFiles) {
    const relPath = file
      .replace(PATHS.root + '/', '')
      .split('\\')
      .join('/');
    if (relPath === 'index.html') continue;
    const src = await readText(file);
    const re = /<script[^>]+src\s*=\s*['"](https?:\/\/[^'"]+)['"]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
      violations.push(
        warning('external-script-in-html', `External script in ${relPath}: ${m[1]}`, {
          file: relPath,
          line: lineNumberAt(src, m.index),
        }),
      );
      if (m.index === re.lastIndex) re.lastIndex += 1;
    }
  }

  // Rule 4: index.html has no third-party scripts loaded synchronously.
  const indexPath = join(PATHS.root, 'index.html');
  if (await pathExists(indexPath)) {
    const src = await readText(indexPath);
    const re = /<script[^>]+src\s*=\s*['"](https?:\/\/(?!localhost)[^'"]+)['"]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
      violations.push(
        error('third-party-sync-script', `External script loaded from index.html: ${m[1]}`, {
          file: 'index.html',
          line: lineNumberAt(src, m.index),
          hint: 'Load third-party scripts only after consent, from a component.',
        }),
      );
      if (m.index === re.lastIndex) re.lastIndex += 1;
    }
  }

  return violations;
}
