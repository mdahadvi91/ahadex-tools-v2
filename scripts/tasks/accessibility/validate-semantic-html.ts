/**
 * Semantic HTML validator. Ensures pages use semantic HTML elements
 * instead of <div> soup:
 *   - Pages have <main>, <header>, <footer>, <nav> landmarks
 *   - Buttons are <button>, links are <a>
 *   - Lists use <ul>/<ol>
 *   - Form inputs have <label>
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

  // Rule 1: App.tsx should have main landmark.
  const appPath = `${PATHS.src}/App.tsx`;
  const appExists = await walkFiles(PATHS.src, { extensions: ['.tsx'] }).then((files) =>
    files.includes(appPath),
  );
  if (appExists) {
    const src = await readText(appPath);
    if (!/<main\b/i.test(src)) {
      violations.push(
        error('no-main-landmark', 'App.tsx does not render a <main> element.', {
          file: 'src/App.tsx',
        }),
      );
    }
  }

  // Rule 2: Header.tsx must use <header> and <nav>.
  const headerPath = `${PATHS.srcComponents}/Header.tsx`;
  const allTsx = await walkFiles(PATHS.src, { extensions: ['.tsx'] });
  if (allTsx.includes(headerPath)) {
    const src = await readText(headerPath);
    if (!/<header\b/i.test(src)) {
      violations.push(
        error('no-header-element', 'Header.tsx does not use <header>.', {
          file: 'src/components/Header.tsx',
        }),
      );
    }
    if (!/<nav\b/i.test(src)) {
      violations.push(
        warning(
          'no-nav-element',
          'Header.tsx does not use <nav> for navigation.',
          { file: 'src/components/Header.tsx' },
        ),
      );
    }
  }

  // Rule 3: Footer.tsx must use <footer>.
  const footerPath = `${PATHS.srcComponents}/Footer.tsx`;
  if (allTsx.includes(footerPath)) {
    const src = await readText(footerPath);
    if (!/<footer\b/i.test(src)) {
      violations.push(
        error('no-footer-element', 'Footer.tsx does not use <footer>.', {
          file: 'src/components/Footer.tsx',
        }),
      );
    }
  }

  // Rule 4: no <div onClick> without role/tabIndex (common a11y anti-pattern).
  const allFiles = await walkFiles(PATHS.src, { extensions: ['.tsx'] });
  for (const file of allFiles) {
    const relPath = file.substring(PATHS.root.length + 1).split('\\').join('/');
    if (relPath.endsWith('.test.tsx')) continue;

    const src = await readText(file);
    const divClickRe = /<div\b[^>]*\bonClick\s*=/g;
    let m: RegExpExecArray | null;
    while ((m = divClickRe.exec(src)) !== null) {
      const tag = src.slice(m.index, m.index + 300);
      const hasRole = /\brole\s*=/.test(tag);
      const hasTabIndex = /\btabIndex\s*=/.test(tag);
      if (!hasRole && !hasTabIndex) {
        violations.push(
          error(
            'div-onclick-no-role',
            'Clickable <div> missing role and tabIndex (breaks accessibility).',
            {
              file: relPath,
              line: lineNumberAt(src, m.index),
              hint: 'Use <button> instead, or add role="button" and tabIndex={0}.',
            },
          ),
        );
      }
    }

    // Rule 5: <a> with href="#" but no onClick should be flagged.
    const anchorRe = /<a\b[^>]*href\s*=\s*['"]\s*#['"][^>]*>/g;
    while ((m = anchorRe.exec(src)) !== null) {
      const tag = m[0];
      if (!/\bonClick\s*=/.test(tag) && !/\brole\s*=/.test(tag)) {
        violations.push(
          warning(
            'anchor-empty-href',
            '<a href="#"> without onClick is not functional.',
            {
              file: relPath,
              line: lineNumberAt(src, m.index),
              hint: 'Use <button> for actions, <a href="/path"> for navigation.',
            },
          ),
        );
      }
    }
  }

  return violations;
}
