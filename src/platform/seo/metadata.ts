/**
 * Types and helpers for per-route SEO metadata.
 */

export interface PageMetadata {
  title: string;
  description: string;
  path: string;
  ogImage?: string; // Added for Open Graph
  type?: 'website' | 'article';
  noIndex?: boolean;
  jsonLd?: Record<string, any> | Record<string, any>[]; // Added for Google Rich Results
}

const MAX_TITLE = 60;
const MAX_DESCRIPTION = 160;

export function truncateTitle(title: string): string {
  if (title.length <= MAX_TITLE) return title;
  return `${title.slice(0, MAX_TITLE - 3)}...`;
}

export function truncateDescription(description: string): string {
  if (description.length <= MAX_DESCRIPTION) return description;
  return `${description.slice(0, MAX_DESCRIPTION - 3)}...`;
}

export function normalizeMetadata(meta: PageMetadata): PageMetadata {
  return {
    ...meta,
    title: truncateTitle(meta.title),
    description: truncateDescription(meta.description),
  };
}
