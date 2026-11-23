/**
 * Authoritative configuration for core informational & legal routes.
 * Shared cleanly between the React app (browser/SSR) and Node build/SEO scripts.
 */

export interface StaticPageRouteConfig {
  readonly slug: string;
  readonly path: string;
  readonly title: string;
  readonly description: string;
  readonly indexable: boolean;
  readonly sitemap: boolean;
  readonly priority: string;
}

export const STATIC_PAGE_ROUTES: readonly StaticPageRouteConfig[] = [
  {
    slug: 'home',
    path: '/',
    title: 'AHADEX Tools - Free, Privacy-First Online Image & PDF Tools',
    description:
      'Compress, resize, and convert images and PDFs directly in your browser. Zero server uploads, zero tracking, instant results.',
    indexable: true,
    sitemap: true,
    priority: '1.0',
  },
  {
    slug: 'about',
    path: '/about/',
    title: 'About AHADEX Tools - Privacy-First Browser Utilities',
    description:
      'Learn how AHADEX Tools processes images and documents locally in your browser without uploading files to external servers.',
    indexable: true,
    sitemap: true,
    priority: '0.5',
  },
  {
    slug: 'contact',
    path: '/contact/',
    title: 'Contact AHADEX Tools - Feedback & Support',
    description:
      'Get in touch with the AHADEX Tools team for bug reports, feature suggestions, privacy questions, or general inquiries.',
    indexable: true,
    sitemap: true,
    priority: '0.4',
  },
  {
    slug: 'privacy-policy',
    path: '/privacy-policy/',
    title: 'Privacy Policy - Local Browser File Processing | AHADEX Tools',
    description:
      'Read the AHADEX Tools privacy policy explaining local browser-based file processing, analytics consent, cookies, and strict data handling.',
    indexable: true,
    sitemap: true,
    priority: '0.4',
  },
  {
    slug: 'terms',
    path: '/terms/',
    title: 'Terms of Service - Browser File Utilities | AHADEX Tools',
    description:
      'Review the terms of service governing the free client-side image and PDF utilities provided on AHADEX Tools, including acceptable use limits.',
    indexable: true,
    sitemap: true,
    priority: '0.4',
  },
  {
    slug: 'disclaimer',
    path: '/disclaimer/',
    title: 'Disclaimer - Browser File Processing & Limits | AHADEX Tools',
    description:
      'Important disclaimers regarding client-side file processing, output verification, and service availability across AHADEX Tools.',
    indexable: true,
    sitemap: false,
    priority: '0.3',
  },
  {
    slug: 'cookie-policy',
    path: '/cookie-policy/',
    title: 'Cookie Policy - Consent Storage & Preferences | AHADEX Tools',
    description:
      'Details on how AHADEX Tools uses essential browser storage, consent preferences, and optional analytics cookies cleanly and transparently.',
    indexable: true,
    sitemap: false,
    priority: '0.3',
  },
] as const;
