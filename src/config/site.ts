/**
 * Static site metadata used across the application.
 */

import { getEnvironment } from './environment';

export interface SiteConfig {
  readonly name: string;
  readonly shortName: string;
  readonly description: string;
  readonly url: string;
  readonly locale: string;
  readonly direction: 'ltr' | 'rtl';
  readonly themeColor: string;
  readonly twitterHandle: string | null;
}

const SITE: Omit<SiteConfig, 'url'> = {
  name: 'AHADEX Tools',
  shortName: 'AHADEX',
  description:
    'Privacy-first, browser-based file tools. Files are processed locally and never uploaded.',
  locale: 'en',
  direction: 'ltr',
  themeColor: '#ffffff',
  twitterHandle: null,
};

export function getSiteConfig(): SiteConfig {
  return {
    ...SITE,
    url: getEnvironment().siteUrl,
  };
}
