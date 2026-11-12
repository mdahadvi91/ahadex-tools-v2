/**
 * Brand consistency validator. Ensures brand name is spelled the same
 * everywhere:
 *   - "AHADEX Tools" (not "Ahadex Tools", "AHadex tools", etc.)
 *   - Domain "ahadex.online" (lowercase)
 *   - Email "hello@ahadex.online"
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { warning, type Violation } from '../../utils/validation-result';

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
    if (relPath.includes('node_modules')) continue;

    const src = await readText(file);

    // Rule 1: wrong capitalization variants.
    const wrongNames = [
      /Ahadex Tools/g,
      /Ahadex tools/g,
      /Ahadex tools/g,
      /AHadex Tools/g,
      /ahadex Tools/g,
    ];
    for (const pattern of wrongNames) {
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(src)) !== null) {
        violations.push(
          warning(
            'brand-name-inconsistent',
            `Wrong brand spelling: "${m[0]}" (should be "AHADEX Tools").`,
            {
              file: relPath,
              line: lineNumberAt(src, m.index),
            },
          ),
        );
        if (m.index === pattern.lastIndex) pattern.lastIndex += 1;
      }
    }

    // Rule 2: email variants.
    const wrongEmails = [
      /hello@AHADEX\.online/gi,
      /hello@Ahadex\.online/gi,
    ];
    for (const pattern of wrongEmails) {
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(src)) !== null) {
        violations.push(
          warning(
            'brand-email-inconsistent',
            `Email casing inconsistent: "${m[0]}" (should be "hello@ahadex.online").`,
            {
              file: relPath,
              line: lineNumberAt(src, m.index),
            },
          ),
        );
        if (m.index === pattern.lastIndex) pattern.lastIndex += 1;
      }
    }

    // Rule 3: domain with www.
    const wrongDomains = [/www\.ahadex\.online/gi];
    for (const pattern of wrongDomains) {
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(src)) !== null) {
        violations.push(
          warning(
            'brand-domain-www',
            `Canonical domain uses www: "${m[0]}".`,
            {
              file: relPath,
              line: lineNumberAt(src, m.index),
              hint: 'Canonical domain is "ahadex.online" (no www).',
            },
          ),
        );
        if (m.index === pattern.lastIndex) pattern.lastIndex += 1;
      }
    }
  }

  return violations;
}
