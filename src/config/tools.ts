/**
 * Shared tool manifest contract across routes, SEO, and tool modules.
 */

export type ToolStatus = 'draft' | 'live' | 'deprecated';

export interface ToolManifest {
  slug: string;
  path: string;
  title: string;
  description: string;
  indexable: boolean;
  sitemap: boolean;
  status: ToolStatus;
  launchOrder: number;
  requiresConsent: boolean;
}
