/**
 * Task registry. Maps each validation group to its ordered list of
 * validators. Validators are imported lazily so that `npm run check:*`
 * for one group does not load others.
 *
 * Empty groups are intentional during early development. A group
 * becomes active as its validators are implemented. The orchestrator
 * skips empty groups cleanly.
 */

import type { GroupName, GroupRegistry, TaskRegistry } from './task-types';

const NO_TASKS: readonly never[] = [];

export const TASKS: TaskRegistry = Object.freeze({
  architecture: {
    name: 'architecture',
    description: 'Import boundaries, cycles, module purity, registry integrity.',
    tasks: NO_TASKS,
  },
  quality: {
    name: 'quality',
    description: 'Type check, lint, format, unused exports, dependency drift.',
    tasks: NO_TASKS,
  },
  security: {
    name: 'security',
    description: 'Dependency audit, secret scan, CSP, prototype pollution.',
    tasks: NO_TASKS,
  },
  seo: {
    name: 'seo',
    description: 'Metadata, canonical, social, keywords, internal links.',
    tasks: NO_TASKS,
  },
  content: {
    name: 'content',
    description: 'Structure, headings, FAQs, quality, freshness, attribution.',
    tasks: NO_TASKS,
  },
  geo: {
    name: 'geo',
    description: 'Entity consistency, answer structure, AI readability.',
    tasks: NO_TASKS,
  },
  schema: {
    name: 'schema',
    description: 'JSON-LD validity, types, URLs, duplicates, consistency.',
    tasks: NO_TASKS,
  },
  assets: {
    name: 'assets',
    description: 'OG images, image assets, alt text, references, unused.',
    tasks: NO_TASKS,
  },
  indexing: {
    name: 'indexing',
    description: 'Sitemap, robots, indexability, hreflang, URL coverage.',
    tasks: NO_TASKS,
  },
  growth: {
    name: 'growth',
    description: 'Content inventory, link targets, brand consistency.',
    tasks: NO_TASKS,
  },
  privacy: {
    name: 'privacy',
    description: 'Cookie consent, enforcement, privacy links, data minimization.',
    tasks: NO_TASKS,
  },
  accessibility: {
    name: 'accessibility',
    description: 'Semantic HTML, keyboard, ARIA, focus, color contrast.',
    tasks: NO_TASKS,
  },
  performance: {
    name: 'performance',
    description: 'Bundle size, Web Vitals, resource and third-party budgets.',
    tasks: NO_TASKS,
  },
  analytics: {
    name: 'analytics',
    description: 'Event schema, privacy, consent tracking, analytics config.',
    tasks: NO_TASKS,
  },
  i18n: {
    name: 'i18n',
    description: 'Locale config, translations, hreflang, locale metadata.',
    tasks: NO_TASKS,
  },
  adsense: {
    name: 'adsense',
    description: 'ads.txt, ad placement, labels, content policy, publisher.',
    tasks: NO_TASKS,
  },
  production: {
    name: 'production',
    description: 'Build, prerender, static HTML, route output, Lighthouse.',
    tasks: NO_TASKS,
  },
} as const);

export function getGroup(name: GroupName): GroupRegistry {
  return TASKS[name];
}

export function groupHasTasks(name: GroupName): boolean {
  return TASKS[name].tasks.length > 0;
}
