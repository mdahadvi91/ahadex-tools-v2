/**
 * Group dependency graph. Defines which validation groups must run
 * before which others. Consumed by all.orchestrator.ts to compute a
 * topological execution order.
 */

import type { GroupName } from './task-types';

export const GROUP_DEPENDENCIES: Readonly<Record<GroupName, readonly GroupName[]>> = Object.freeze({
  architecture: [],
  quality: ['architecture'],
  security: ['architecture'],
  seo: ['architecture'],
  content: ['seo'],
  geo: ['content'],
  schema: ['seo', 'content'],
  assets: ['seo'],
  indexing: ['schema', 'content', 'assets'],
  growth: ['seo', 'content'],
  privacy: ['security'],
  accessibility: ['quality'],
  performance: ['quality'],
  analytics: ['privacy'],
  i18n: ['seo', 'content'],
  adsense: ['content', 'privacy', 'security'],
  production: [
    'architecture',
    'quality',
    'security',
    'seo',
    'content',
    'geo',
    'schema',
    'assets',
    'indexing',
    'growth',
    'privacy',
    'accessibility',
    'performance',
    'analytics',
    'i18n',
    'adsense',
  ],
});

/**
 * Returns the full list of group names in declaration order.
 * Useful for iterating when no dependency edges exist yet.
 */
export function listGroups(): GroupName[] {
  return Object.keys(GROUP_DEPENDENCIES) as GroupName[];
}
