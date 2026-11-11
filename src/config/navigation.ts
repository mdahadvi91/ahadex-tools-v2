/**
 * Static navigation items for header and footer.
 */

export interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly external?: boolean;
}

export interface FooterSection {
  readonly title: string;
  readonly items: readonly NavItem[];
}

export const HEADER_NAV: readonly NavItem[] = Object.freeze([
  { label: 'Home', href: '/' },
  { label: 'Tools', href: '/tools' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]);

export const FOOTER_SECTIONS: readonly FooterSection[] = Object.freeze([
  {
    title: 'Tools',
    items: [
      { label: 'Image Compressor', href: '/tools/image-compressor' },
      { label: 'Image Resizer', href: '/tools/image-resizer' },
      { label: 'Merge PDF', href: '/tools/merge-pdf' },
    ],
  },
  {
    title: 'Company',
    items: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Disclaimer', href: '/disclaimer' },
      { label: 'Cookie Policy', href: '/cookies' },
    ],
  },
]);
