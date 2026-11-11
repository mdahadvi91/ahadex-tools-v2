/**
 * Analytics config validator. Ensures the analytics config is safe:
 *   - VITE_GA_MEASUREMENT_ID format (G-XXXXXXXXXX) when set
 *   - feature-flags.ts gates analytics on env presence
 *   - environment.ts exposes gaMeasurementId (null when disabled)
 *   - .env.example documents the variable
 *   - no hardcoded GA ID anywhere in src/
 */

import { join } from 'node:path';
import { readText, walkFiles, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

const ENV_FILE = join(PATHS.srcConfig, 'environment.ts');
const FLAGS_FILE = join(PATHS.srcConfig, 'feature-flags.ts');
const GA_ID_PATTERN = /^G-[A-Z0-9]{6,}$/;

function lineNumberAt(src: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < src.length; i++) {
    if (src.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  // Rule 1: .env.example documents VITE_GA_MEASUREMENT_ID.
  if (await pathExists(PATHS.envExample)) {
    const envSrc = await readText(PATHS.envExample);
    if (!/VITE_GA_MEASUREMENT_ID/.test(envSrc)) {
      violations.push(
        error(
          'env-example-missing-ga',
          '.env.example does not document VITE_GA_MEASUREMENT_ID.',
          { file: '.env.example' },
        ),
      );
    }
  }

  // Rule 2: environment.ts exposes gaMeasurementId as nullable.
  if (!(await pathExists(ENV_FILE))) {
    violations.push(
      error('environment-missing', 'src/config/environment.ts is missing.', {
        file: 'src/config/environment.ts',
      }),
    );
  } else {
    const src = await readText(ENV_FILE);
    if (!/gaMeasurementId/.test(src)) {
      violations.push(
        error(
          'environment-no-ga',
          'environment.ts does not expose gaMeasurementId.',
          { file: 'src/config/environment.ts' },
        ),
      );
    }
    // Must be nullable (null when disabled).
    if (!/gaMeasurementId\s*:\s*string\s*\|\s*null/.test(src)) {
      violations.push(
        warning(
          'environment-ga-not-nullable',
          'gaMeasurementId should be string | null (null when analytics disabled).',
          { file: 'src/config/environment.ts' },
        ),
      );
    }
    // Format validation should exist.
    if (!/GA_ID_PATTERN|G-/.test(src)) {
      violations.push(
        warning(
          'environment-no-ga-pattern',
          'environment.ts does not validate GA ID format.',
          { file: 'src/config/environment.ts' },
        ),
      );
    }
  }

  // Rule 3: feature-flags.ts gates analytics on env presence.
  if (!(await pathExists(FLAGS_FILE))) {
    violations.push(
      error('feature-flags-missing', 'src/config/feature-flags.ts is missing.', {
        file: 'src/config/feature-flags.ts',
      }),
    );
  } else {
    const src = await readText(FLAGS_FILE);
    if (!/analytics\s*:/.test(src)) {
      violations.push(
        error(
          'flags-no-analytics',
          'feature-flags.ts does not declare an "analytics" flag.',
          { file: 'src/config/feature-flags.ts' },
        ),
      );
    }
    if (!/gaMeasurementId/.test(src)) {
      violations.push(
        warning(
          'flags-no-ga-reference',
          'feature-flags.ts does not check gaMeasurementId.',
          {
            file: 'src/config/feature-flags.ts',
            hint: 'Analytics should be enabled only when a GA ID is present.',
          },
        ),
      );
    }
  }

  // Rule 4: no hardcoded GA ID anywhere in src/.
  const sourceFiles = await walkFiles(PATHS.src, { extensions: ['.ts', '.tsx'] });
  for (const file of sourceFiles) {
    const relPath = file.replace(PATHS.root + '/', '').split('\\').join('/');
    if (relPath.endsWith('.test.ts') || relPath.endsWith('.test.tsx')) continue;

    const src = await readText(file);
    const re = /\bG-[A-Z0-9]{6,}\b/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
      // Allow matches inside comments or code that checks the pattern.
      const context = src.slice(Math.max(0, m.index - 100), m.index + m[0].length + 100);
      if (/GA_ID_PATTERN|regex|pattern|test\(/i.test(context)) continue;
      if (GA_ID_PATTERN.test(m[0])) {
        violations.push(
          warning(
            'hardcoded-ga-id',
            `Possible hardcoded GA ID: "${m[0]}".`,
            {
              file: relPath,
              line: lineNumberAt(src, m.index),
              hint: 'Use VITE_GA_MEASUREMENT_ID instead.',
            },
          ),
        );
      }
      if (m.index === re.lastIndex) re.lastIndex += 1;
    }
  }

  return violations;
}
