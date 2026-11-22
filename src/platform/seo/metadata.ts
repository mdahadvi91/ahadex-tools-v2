export interface PageMetadata {
  readonly title: string;
  readonly description: string;
  readonly path?: string;
  readonly canonicalPath?: string;
  readonly ogImage?: string;
  readonly image?: string;
  readonly type?: string;
  readonly indexable?: boolean;
  readonly noIndex?: boolean;
  readonly jsonLd?: Record<string, unknown> | readonly Record<string, unknown>[];
}
