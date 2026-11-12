/**
 * AdSense publisher config validator. Ensures the AdSense publisher
 * ID is configured correctly:
 *   - VITE_ADSENSE_PUBLISHER_ID matches format ca-pub-XXXXXXXXXXXXXXXX
 *   - .env.example documents the variable
 *   - feature-flags.ts gates ads on publisher presence
 *   - No hardcoded publisher IDs in source
 *
 * Skips gracefully when the publisher ID is not yet configured.
 */

import { join } from 'node:path';
import { walkFiles, readText, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, info, warning, type Violation } from '../../utils/validation-result';

const ADSENSE_ID_PATTERN = /^ca-pub-\d{16}$/;

function lineNumberAt(source: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const publisherId = process.env.VITE_ADSENSE_PUBLISHER_ID?.trim();

  // Rule 1: .env.example documents the variable (always check).
  if (await pathExists(PATHS.envExample)) {
    const envSrc = await readText(PATHS.envExample);
    if (!/VITE_ADSENSE_PUBLISHER_ID/.test(envSrc)) {
      violations.push(
        error(
          'env-example-missing-adsense',
          '.env.example does not document VITE_ADSENSE_PUBLISHER_ID.',
          { file: '.env.example' },
        ),
      );
    }
  }

  // Rule 2: if publisher ID configured, validate its format.
  if (!publisherId) {
    violations.push(
      info(
        'publisher-config-skipped',
        'VITE_ADSENSE_PUBLISHER_ID is not set. AdSense validation deferred until approval.',
      ),
    );
    return violations;
  }

  if (!ADSENSE_ID_PATTERN.test(publisherId)) {
    violations.push(
      error(
        'publisher-id-malformed',
        `VITE_ADSENSE_PUBLISHER_ID "${publisherId}" is not in ca-pub-XXXXXXXXXXXXXXXX format.`,
        {
          hint: 'The publisher ID must be exactly "ca-pub-" followed by 16 digits.',
        },
      ),
    );
  }

  // Rule 3: environment.ts exposes adsensePublisherId as nullable.
  const envPath = join(PATHS.srcConfig, 'environment.ts');
  if (await pathExists(envPath)) {
    const src = await readText(envPath);
    if (!/adsensePublisherId/.test(src)) {
      violations.push(
        error(
          'environment-no-adsense',
          'environment.ts does not expose adsensePublisherId.',
          { file: 'src/config/environment.ts' },
        ),
      );
    }
    if (!/adsensePublisherId\s*:\s*string\s*\|\s*null/.test(src)) {
      violations.push(
        warning(
          'environment-adsense-not-nullable',
          'adsensePublisherId should be string | null.',
          { file: 'src/config/environment.ts' },
        ),
      );
    }
  }

  // Rule 4: feature-flags.ts gates ads on publisher presence.
  const flagsPath = join(PATHS.srcConfig, 'feature-flags.ts');
  if (await pathExists(flagsPath)) {
    const src = await readText(flagsPath);
    if (!/ads\s*:/.test(src)) {
      violations.push(
        error(
          'flags-no-ads',
          'feature-flags.ts does not declare an "ads" flag.',
          { file: 'src/config/feature-flags.ts' },
        ),
      );
    }
    if (!/adsensePublisherId/.test(src)) {
      violations.push(
        warning(
          'flags-no-adsense-ref',
          'feature-flags.ts does not reference adsensePublisherId.',
          {
            file: 'src/config/feature-flags.ts',
            hint: 'Ads should be enabled only when a publisher ID is present.',
          },
        ),
      );
    }
  }

  // Rule 5: no hardcoded AdSense publisher IDs in src/.
  const sourceFiles = await walkFiles(PATHS.src, { extensions: ['.ts', '.tsx'] });
  for (const file of sourceFiles) {
    const relPath = file.substring(PATHS.root.length + 1).split('\\').join('/');
    if (relPath.endsWith('.test.ts') || relPath.endsWith('.test.tsx')) continue;

    const src = await readText(file);
    const re = /\bca-pub-\d{16}\b/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
      // Allow if it's inside a regex or pattern definition.
      const context = src.slice(Math.max(0, m.index - 100), m.index + m[0].length + 100);
      if (/PATTERN|regex|pattern|test\(/i.test(context)) continue;

      violations.push(
        warning(
          'hardcoded-publisher-id',
          `Possible hardcoded AdSense ID: "${m[0]}".`,
          {
            file: relPath,
            line: lineNumberAt(src, m.index),
            hint: 'Use VITE_ADSENSE_PUBLISHER_ID instead.',
          },
        ),
      );
      if (m.index === re.lastIndex) re.lastIndex += 1;
    }
  }

  return violations;
}
