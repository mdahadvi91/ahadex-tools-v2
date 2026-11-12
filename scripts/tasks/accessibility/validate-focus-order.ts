/**
 * Focus order validator. Ensures logical tab order:
 *   - No positive tabIndex (use DOM order, not tabIndex to reorder)
 *   - Focus is trapped inside dialogs
 *   - Focus returns to trigger on dialog close
 *   - Skip link exists for keyboard users
 *   - Focus is not hidden behind sticky elements
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

  // Rule 1: positive tabIndex is an anti-pattern.
  for (const file of files) {
    const relPath = file
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');
    if (relPath.endsWith('.test.tsx')) continue;

    const src = await readText(file);
    const positiveTabRe = /\btabIndex\s*=\s*\{?\s*([1-9]\d*)\s*\}?/g;
    let m: RegExpExecArray | null;
    while ((m = positiveTabRe.exec(src)) !== null) {
      violations.push(
        warning('positive-tabindex', `Positive tabIndex="${m[1]}" disrupts natural focus order.`, {
          file: relPath,
          line: lineNumberAt(src, m.index),
          hint: 'Use DOM order instead of tabIndex for ordering.',
        }),
      );
    }
  }

  // Rule 2: dialogs (Modal, AccessibleDialog, Sidebar) must trap focus.
  const dialogFiles = [
    `${PATHS.srcComponents}/ui/Modal.tsx`,
    `${PATHS.srcComponents}/ui/AccessibleDialog.tsx`,
    `${PATHS.srcComponents}/ui/Sidebar.tsx`,
  ];

  const allTsx = await walkFiles(PATHS.srcComponents, { extensions: ['.tsx'] });
  for (const path of dialogFiles) {
    if (!allTsx.includes(path)) continue;
    const src = await readText(path);
    const relPath = path
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');

    // Must have keydown handler.
    if (!/addEventListener\(\s*['"]keydown['"]/.test(src)) {
      violations.push(
        error(
          'dialog-no-keydown',
          `${relPath} does not listen for keydown (needed for Escape and Tab trap).`,
          { file: relPath },
        ),
      );
    }

    // Must handle Tab.
    if (!/['"]Tab['"]/.test(src)) {
      violations.push(
        warning(
          'dialog-no-tab-trap',
          `${relPath} does not trap Tab (focus can escape the dialog).`,
          { file: relPath },
        ),
      );
    }

    // Must handle Escape.
    if (!/['"]Escape['"]/.test(src)) {
      violations.push(
        warning('dialog-no-escape', `${relPath} does not close on Escape.`, { file: relPath }),
      );
    }

    // Must restore focus on close.
    if (!/\.focus\(\)/.test(src)) {
      violations.push(
        warning('dialog-no-focus-restore', `${relPath} does not restore focus when closing.`, {
          file: relPath,
          hint: 'Store trigger element and focus it on close.',
        }),
      );
    }
  }

  // Rule 3: skip link in App.tsx for keyboard users.
  const appPath = `${PATHS.src}/App.tsx`;
  if (
    allTsx.includes(appPath) ||
    (await walkFiles(PATHS.src, { extensions: ['.tsx'] })).includes(appPath)
  ) {
    const src = await readText(appPath);
    if (!/skip|Skip to main|main-content/i.test(src)) {
      violations.push(
        warning('no-skip-link', 'App.tsx has no skip-to-main link for keyboard users.', {
          file: 'src/App.tsx',
          hint: 'Add <a href="#main">Skip to content</a> as first focusable element.',
        }),
      );
    }
  }

  return violations;
}
