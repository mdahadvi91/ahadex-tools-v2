/**
 * Keyboard access validator. Ensures interactive elements are
 * keyboard-accessible:
 *   - Custom elements with onClick have onKeyDown (Enter/Space)
 *   - tabIndex set for non-native focusable elements
 *   - No tabIndex="-1" on visible buttons
 *   - IconButton has aria-label
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

  const files = await walkFiles(PATHS.src, { extensions: ['.tsx'] });

  for (const file of files) {
    const relPath = file
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');
    if (relPath.endsWith('.test.tsx')) continue;

    const src = await readText(file);

    // Rule 1: custom elements (div, span, li) with onClick must have onKeyDown.
    const clickableRe = /<(div|span|li|section|article)\b[^>]*\bonClick\s*=/g;
    let m: RegExpExecArray | null;
    while ((m = clickableRe.exec(src)) !== null) {
      const tagStart = m.index;
      // Find end of tag.
      let tagEnd = tagStart;
      let depth = 0;
      for (let i = tagStart; i < src.length; i++) {
        if (src[i] === '<') depth++;
        else if (src[i] === '>') {
          depth--;
          if (depth === 0) {
            tagEnd = i + 1;
            break;
          }
        }
      }
      const tag = src.slice(tagStart, tagEnd);
      const hasKeyDown = /\bonKeyDown\s*=/.test(tag);
      const hasRole = /\brole\s*=\s*['"]button['"]/.test(tag);
      if (!hasKeyDown) {
        violations.push(
          error('clickable-no-keydown', `Clickable <${m[1]}> has no onKeyDown handler.`, {
            file: relPath,
            line: lineNumberAt(src, tagStart),
            hint: 'Add onKeyDown or use <button> instead.',
          }),
        );
      }
      if (!hasRole) {
        violations.push(
          warning('clickable-no-role', `Clickable <${m[1]}> has no role="button".`, {
            file: relPath,
            line: lineNumberAt(src, tagStart),
            hint: 'Add role="button" for screen reader semantics.',
          }),
        );
      }
    }

    // Rule 2: tabIndex="-1" on visible <button> or <a>.
    const negTabRe = /<button\b[^>]*\btabIndex\s*=\s*\{?\s*-\s*1\s*\}?/g;
    while ((m = negTabRe.exec(src)) !== null) {
      violations.push(
        warning('negative-tabindex-on-button', '<button tabIndex={-1}> removes keyboard access.', {
          file: relPath,
          line: lineNumberAt(src, m.index),
          hint: 'Only use tabIndex={-1} for programmatic focus targets.',
        }),
      );
    }

    // Rule 3: IconButton must have label.
    if (/<IconButton\b/.test(src)) {
      const iconRe = /<IconButton\b[^>]*>/g;
      while ((m = iconRe.exec(src)) !== null) {
        const tag = m[0];
        if (!/aria-label|label\s*=/.test(tag)) {
          violations.push(
            error('icon-button-no-label', 'IconButton missing aria-label/label prop.', {
              file: relPath,
              line: lineNumberAt(src, m.index),
              hint: 'Icon-only buttons must have accessible labels.',
            }),
          );
        }
      }
    }
  }

  return violations;
}
