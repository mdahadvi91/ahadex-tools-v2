/**
 * Color contrast validator. Ensures text colors in Tailwind classes
 * meet WCAG AA (4.5:1 for normal text, 3:1 for large text):
 *   - Detects `text-gray-*` / `text-blue-*` / etc against bg-white
 *   - Detects `text-white` on light backgrounds
 *   - Flags low-contrast brand colors
 *
 * This is a static approximation. The actual pixel-level check runs
 * in Playwright visual regression tests.
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { warning, type Violation } from '../../utils/validation-result';

/** Known contrast pairs (Tailwind default scale) below 4.5:1 on white. */
const LOW_CONTRAST_ON_WHITE = [
  'text-gray-200',
  'text-gray-300',
  'text-gray-400',
  'text-slate-200',
  'text-slate-300',
  'text-slate-400',
  'text-neutral-200',
  'text-neutral-300',
  'text-neutral-400',
  'text-zinc-200',
  'text-zinc-300',
  'text-zinc-400',
  'text-stone-200',
  'text-stone-300',
  'text-stone-400',
  'text-blue-200',
  'text-blue-300',
  'text-blue-400',
  'text-green-300',
  'text-green-400',
  'text-yellow-300',
  'text-orange-300',
  'text-red-300',
];

/** Dark mode overrides are acceptable; skip those lines. */
const DARK_MODE_SAFE = /dark:|bg-gray-900|bg-slate-900|bg-black/;

function lineNumberAt(source: string, index: number): number {
  let count = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) count += 1;
  }
  return count;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const files = await walkFiles(PATHS.src, { extensions: ['.tsx', '.css'] });

  for (const file of files) {
    const relPath = file
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');
    if (relPath.endsWith('.test.tsx')) continue;

    const src = await readText(file);
    const lines = src.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (DARK_MODE_SAFE.test(line)) continue;

      for (const lowContrastClass of LOW_CONTRAST_ON_WHITE) {
        // Match only if not preceded by a bg-dark variant on the same line.
        const regex = new RegExp(`\\b${lowContrastClass}\\b`);
        if (regex.test(line)) {
          violations.push(
            warning(
              'low-contrast-text',
              `"${lowContrastClass}" likely fails WCAG AA contrast on white.`,
              {
                file: relPath,
                line: lineNumberAt(src, lines.slice(0, i).join('\n').length),
                hint: 'Use text-gray-600+ for body text (or add dark: variant).',
              },
            ),
          );
        }
      }

      // Rule: text-white on light backgrounds without dark variant.
      const whiteTextRe = /\btext-white\b/;
      if (whiteTextRe.test(line) && !DARK_MODE_SAFE.test(line)) {
        // Allow if bg-*-600+ (dark backgrounds) or on button.
        const darkBg =
          /\bbg-(?:gray|slate|zinc|neutral|stone|blue|indigo|red|green|emerald|rose|pink|purple|violet)-(?:600|700|800|900)\b/;
        if (!darkBg.test(line) && !/Button|button/.test(src.slice(0, 200))) {
          violations.push(
            warning('white-text-on-light-bg', 'text-white without a dark background class.', {
              file: relPath,
              line: lineNumberAt(src, lines.slice(0, i).join('\n').length),
              hint: 'Add a bg-*-600+ class or a dark: variant.',
            }),
          );
        }
      }
    }
  }

  return violations;
}
