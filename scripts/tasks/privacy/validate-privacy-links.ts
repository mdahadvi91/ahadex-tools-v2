/**
 * Privacy links validator. Ensures the footer and consent UI link to
 * legal pages, and that every legal page exists and is reachable.
 *
 * Requirements:
 *   - Footer links to privacy, terms, disclaimer, cookies.
 *   - Consent UI (once added) links to the cookie policy.
 *   - Every linked path corresponds to an existing page component.
 *   - Legal pages include the contact email.
 */

import { join } from 'node:path';
import { readText, walkFiles, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

const FOOTER = join(PATHS.srcComponents, 'Footer.tsx');
const NAVIGATION = join(PATHS.srcConfig, 'navigation.ts');

/** Every legal path must be linked from FOOTER_SECTIONS in navigation.ts. */
const REQUIRED_LEGAL_LINKS = ['/privacy', '/terms', '/disclaimer', '/cookies'];

const CONTACT_EMAIL = 'hello@ahadex.online';

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  // Rule 1: navigation.ts declares the legal links.
  if (!(await pathExists(NAVIGATION))) {
    violations.push(
      error('navigation-missing', 'src/config/navigation.ts is missing.', {
        file: 'src/config/navigation.ts',
      }),
    );
  } else {
    const nav = await readText(NAVIGATION);
    for (const path of REQUIRED_LEGAL_LINKS) {
      if (!nav.includes(`'${path}'`) && !nav.includes(`"${path}"`)) {
        violations.push(
          error(
            'legal-link-missing',
            `Legal link "${path}" is missing from navigation.ts.`,
            { file: 'src/config/navigation.ts' },
          ),
        );
      }
    }
  }

  // Rule 2: Footer uses FOOTER_SECTIONS (which include the legal links).
  if (!(await pathExists(FOOTER))) {
    violations.push(
      error('footer-missing', 'src/components/Footer.tsx is missing.', {
        file: 'src/components/Footer.tsx',
      }),
    );
  } else {
    const footer = await readText(FOOTER);
    if (!/FOOTER_SECTIONS/.test(footer)) {
      violations.push(
        error(
          'footer-no-sections',
          'Footer.tsx does not render FOOTER_SECTIONS.',
          {
            file: 'src/components/Footer.tsx',
            hint: 'Legal links are unreachable from the footer.',
          },
        ),
      );
    }
  }

  // Rule 3: every legal page exists and includes the contact email.
  const pages = await walkFiles(PATHS.srcPages, { extensions: ['.tsx'] });
  const pageBasenames = new Set(
    pages.map((p) => p.split('/').pop()?.replace('.tsx', '') ?? ''),
  );

  const requiredPages: Array<[string, string]> = [
    ['PrivacyPolicy', 'privacy'],
    ['Terms', 'terms'],
    ['Disclaimer', 'disclaimer'],
    ['CookiePolicy', 'cookies'],
  ];

  for (const [componentName, routeName] of requiredPages) {
    if (!pageBasenames.has(componentName)) {
      violations.push(
        error(
          'legal-page-missing',
          `Legal page ${componentName}.tsx is missing (route /${routeName}).`,
          { file: `src/pages/${componentName}.tsx` },
        ),
      );
    }
  }

  // Rule 4: PrivacyPolicy mentions contact email.
  const privacyPath = join(PATHS.srcPages, 'PrivacyPolicy.tsx');
  if (await pathExists(privacyPath)) {
    const src = await readText(privacyPath);
    if (!src.includes(CONTACT_EMAIL)) {
      violations.push(
        warning(
          'privacy-no-contact',
          'Privacy Policy does not include the contact email.',
          { file: 'src/pages/PrivacyPolicy.tsx', hint: `Include ${CONTACT_EMAIL}.` },
        ),
      );
    }
  }

  // Rule 5: app must expose /privacy and /cookies routes.
  const routesPath = join(PATHS.srcRouter, 'routes.tsx');
  if (await pathExists(routesPath)) {
    const routes = await readText(routesPath);
    for (const path of REQUIRED_LEGAL_LINKS) {
      if (!routes.includes(`'${path}'`) && !routes.includes(`"${path}"`)) {
        violations.push(
          error(
            'legal-route-missing',
            `Route "${path}" is missing from routes.tsx.`,
            { file: 'src/router/routes.tsx' },
          ),
        );
      }
    }
  }

  return violations;
}
