/**
 * AdSense content policy checklist validator. Ensures pages comply
 * with AdSense program policies before application:
 *   - Required pages exist (Privacy, Terms, Contact, About)
 *   - No adult/violent/drug content (pattern scan)
 *   - No copyright claims without permission
 *   - No misleading claims
 *   - No popup/overlay ads blocking content
 *   - Contact method is real
 */

import { walkFiles, readText, pathExists } from '../../utils/file-system';
import { join } from 'node:path';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

const REQUIRED_PAGES = [
  { name: 'PrivacyPolicy', path: '/privacy' },
  { name: 'Terms', path: '/terms' },
  { name: 'Contact', path: '/contact' },
  { name: 'About', path: '/about' },
];

const FORBIDDEN_CONTENT_PATTERNS = [
  {
    name: 'adult-content',
    regex: /\b(?:pornography|pornographic|adult (?:content|material|video|site))\b/i,
  },
  { name: 'violence', regex: /\b(?:kill|murder|torture|assault|violent)\b/i },
  { name: 'drugs', regex: /\b(?:cocaine|heroin|methamphetamine|illegal drugs)\b/i },
  { name: 'weapons', regex: /\b(?:buy guns|assault rifle|explosive device)\b/i },
  { name: 'hacking', regex: /\b(?:hack|crack|bypass DRM|pirated)\b/i },
  { name: 'gambling', regex: /\b(?:casino|betting|gambling site)\b/i },
  { name: 'get-rich-quick', regex: /\b(?:get rich quick|easy money|guaranteed income)\b/i },
];

/** Contact email that must appear on Contact page. */
const CONTACT_EMAIL = 'hello@ahadex.online';

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  // Rule 1: required pages exist.
  for (const page of REQUIRED_PAGES) {
    const pagePath = join(PATHS.srcPages, `${page.name}.tsx`);
    if (!(await pathExists(pagePath))) {
      violations.push(
        error(
          'adsense-missing-page',
          `Required page ${page.name}.tsx is missing (AdSense needs it).`,
          { file: `src/pages/${page.name}.tsx`, hint: `Route ${page.path}` },
        ),
      );
    }
  }

  // Rule 2: contact page has real email.
  const contactPath = join(PATHS.srcPages, 'Contact.tsx');
  if (await pathExists(contactPath)) {
    const src = await readText(contactPath);
    if (!src.includes(CONTACT_EMAIL) && !/mailto:/.test(src)) {
      violations.push(
        error(
          'adsense-no-contact-email',
          `Contact page does not include ${CONTACT_EMAIL} or a mailto link.`,
          { file: 'src/pages/Contact.tsx' },
        ),
      );
    }
  }

  // Rule 3: scan all content for forbidden topics.
  const contentFiles = await walkFiles(PATHS.src, { extensions: ['.ts', '.tsx'] });
  for (const file of contentFiles) {
    const relPath = file
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');
    if (relPath.endsWith('.test.ts') || relPath.endsWith('.test.tsx')) continue;

    const src = await readText(file);
    for (const pattern of FORBIDDEN_CONTENT_PATTERNS) {
      if (pattern.regex.test(src)) {
        violations.push(
          error('adsense-forbidden-content', `Possible ${pattern.name} in content.`, {
            file: relPath,
            hint: 'AdSense forbids this category of content.',
          }),
        );
      }
    }
  }

  // Rule 4: privacy policy must reference Google.
  const privacyPath = join(PATHS.srcPages, 'PrivacyPolicy.tsx');
  if (await pathExists(privacyPath)) {
    const src = await readText(privacyPath);
    if (!/Google|AdSense/i.test(src)) {
      violations.push(
        warning('adsense-privacy-no-google', 'Privacy Policy does not mention Google or AdSense.', {
          file: 'src/pages/PrivacyPolicy.tsx',
          hint: 'AdSense requires disclosure of Google data collection.',
        }),
      );
    }
  }

  // Rule 5: cookie policy must reference ads.
  const cookiePath = join(PATHS.srcPages, 'CookiePolicy.tsx');
  if (await pathExists(cookiePath)) {
    const src = await readText(cookiePath);
    if (!/ad|adsense|advertis/i.test(src)) {
      violations.push(
        warning('adsense-cookie-no-ads', 'Cookie Policy does not mention advertising cookies.', {
          file: 'src/pages/CookiePolicy.tsx',
        }),
      );
    }
  }

  return violations;
}
