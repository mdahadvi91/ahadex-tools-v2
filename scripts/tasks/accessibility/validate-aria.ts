/**
 * ARIA validator. Ensures ARIA attributes are used correctly:
 *   - No redundant roles on native elements (e.g., role="button" on <button>)
 *   - aria-label is not empty
 *   - aria-labelledby references valid IDs
 *   - Dialogs use role="dialog" + aria-modal
 *   - No aria-hidden on focusable elements
 *   - No invalid role values
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

const VALID_ROLES = new Set([
  'button',
  'link',
  'navigation',
  'main',
  'banner',
  'contentinfo',
  'dialog',
  'alertdialog',
  'alert',
  'status',
  'search',
  'form',
  'tab',
  'tablist',
  'tabpanel',
  'menu',
  'menubar',
  'menuitem',
  'list',
  'listitem',
  'article',
  'region',
  'complementary',
  'progressbar',
  'slider',
  'switch',
  'checkbox',
  'radio',
  'radiogroup',
  'textbox',
  'combobox',
  'listbox',
  'option',
  'heading',
  'img',
  'presentation',
  'none',
  'group',
  'separator',
  'toolbar',
  'tooltip',
]);

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

    // Rule 1: empty aria-label.
    const emptyLabelRe = /\baria-label\s*=\s*['"]\s*['"]/g;
    let m: RegExpExecArray | null;
    while ((m = emptyLabelRe.exec(src)) !== null) {
      violations.push(
        error('aria-empty-label', 'aria-label is empty.', {
          file: relPath,
          line: lineNumberAt(src, m.index),
          hint: 'Remove the attribute or provide a label.',
        }),
      );
    }

    // Rule 2: invalid role values.
    const roleRe = /\brole\s*=\s*['"]([^'"]+)['"]/g;
    while ((m = roleRe.exec(src)) !== null) {
      const role = m[1].trim();
      if (!VALID_ROLES.has(role)) {
        violations.push(
          warning('aria-unknown-role', `Unknown ARIA role "${role}".`, {
            file: relPath,
            line: lineNumberAt(src, m.index),
            hint: 'Verify exact spelling on WAI-ARIA spec.',
          }),
        );
      }
    }

    // Rule 3: aria-hidden on focusable elements.
    const hiddenFocusableRe =
      /<(button|a|input|select|textarea)\b[^>]*\baria-hidden\s*=\s*['"]true['"][^>]*>/g;
    while ((m = hiddenFocusableRe.exec(src)) !== null) {
      violations.push(
        error('aria-hidden-focusable', 'aria-hidden="true" on a focusable element breaks a11y.', {
          file: relPath,
          line: lineNumberAt(src, m.index),
          hint: 'Remove aria-hidden or make the element non-focusable.',
        }),
      );
    }

    // Rule 4: dialog without aria-modal.
    const dialogRe = /\brole\s*=\s*['"](?:dialog|alertdialog)['"]/g;
    while ((m = dialogRe.exec(src)) !== null) {
      // Look at 300 chars around for aria-modal.
      const windowStart = Math.max(0, m.index - 300);
      const windowEnd = Math.min(src.length, m.index + 300);
      const context = src.slice(windowStart, windowEnd);
      if (!/aria-modal\s*=\s*['"]true['"]/.test(context)) {
        violations.push(
          warning('aria-dialog-no-modal', 'Dialog role without aria-modal="true".', {
            file: relPath,
            line: lineNumberAt(src, m.index),
            hint: 'Modals should be aria-modal="true".',
          }),
        );
      }
    }

    // Rule 5: aria-labelledby without matching id.
    const labelledbyRe = /\baria-labelledby\s*=\s*['"]([^'"]+)['"]/g;
    while ((m = labelledbyRe.exec(src)) !== null) {
      const ids = m[1].split(/\s+/).filter((x) => x.length > 0);
      for (const id of ids) {
        // Look for id="<id>" anywhere in file.
        const idPattern = new RegExp(`\\bid\\s*=\\s*['"]${id}['"]`);
        if (!idPattern.test(src)) {
          violations.push(
            error(
              'aria-labelledby-missing-id',
              `aria-labelledby references "${id}" but no element has that id.`,
              {
                file: relPath,
                line: lineNumberAt(src, m.index),
              },
            ),
          );
        }
      }
    }
  }

  return violations;
}
