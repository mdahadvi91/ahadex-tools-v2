/**
 * Task registry. Maps each validation group to its ordered list of
 * validators.
 */

import type { GroupName, GroupRegistry, TaskRegistry } from './task-types';
import { run as typeCheckRun } from '../tasks/quality/type-check';
import { run as lintRun } from '../tasks/quality/lint';
import { run as formatCheckRun } from '../tasks/quality/format-check';
import { run as unusedExportsRun } from '../tasks/quality/validate-unused-exports';
import { run as dependencyDriftRun } from '../tasks/quality/validate-dependency-drift';
import { run as unitTestsRun } from '../tasks/quality/unit-tests';

import { run as dependencyAuditRun } from '../tasks/security/dependency-audit';
import { run as secretScanRun } from '../tasks/security/secret-scan';
import { run as fileUploadSecurityRun } from '../tasks/security/file-upload-security';
import { run as securityHeadersRun } from '../tasks/security/security-headers';
import { run as validateCspRun } from '../tasks/security/validate-csp';
import { run as prototypePollutionRun } from '../tasks/security/validate-prototype-pollution';
import { run as resourceExhaustionRun } from '../tasks/security/validate-resource-exhaustion';
import { run as sensitiveDataLeaksRun } from '../tasks/security/validate-sensitive-data-leaks';

import { run as generateSitemapRun } from '../tasks/indexing/generate-sitemap';
import { run as validateSitemapRun } from '../tasks/indexing/validate-sitemap';
import { run as validateRobotsRun } from '../tasks/indexing/validate-robots';
import { run as validateIndexabilityRun } from '../tasks/indexing/validate-indexability';
import { run as validateUrlCoverageRun } from '../tasks/indexing/validate-url-coverage';

const NO_TASKS: readonly never[] = [];

export const TASKS: TaskRegistry = Object.freeze({
  architecture: {
    name: 'architecture',
    description: 'Import boundaries, cycles, module purity, registry integrity.',
    tasks: NO_TASKS,
  },
  quality: {
    name: 'quality',
    description: 'Type check, lint, format, unused exports, dependency drift, tests.',
    tasks: [
      { name: 'type-check', group: 'quality', run: typeCheckRun },
      { name: 'lint', group: 'quality', run: lintRun },
      { name: 'format-check', group: 'quality', run: formatCheckRun },
      { name: 'validate-unused-exports', group: 'quality', run: unusedExportsRun },
      { name: 'validate-dependency-drift', group: 'quality', run: dependencyDriftRun },
      { name: 'unit-tests', group: 'quality', run: unitTestsRun },
    ],
  },
  security: {
    name: 'security',
    description: 'Dependency audit, secret scan, CSP, prototype pollution.',
    tasks: [
      { name: 'dependency-audit', group: 'security', run: dependencyAuditRun, timeoutMs: 300000 },
      { name: 'secret-scan', group: 'security', run: secretScanRun },
      { name: 'file-upload-security', group: 'security', run: fileUploadSecurityRun },
      { name: 'security-headers', group: 'security', run: securityHeadersRun },
      { name: 'validate-csp', group: 'security', run: validateCspRun },
      { name: 'validate-prototype-pollution', group: 'security', run: prototypePollutionRun },
      { name: 'validate-resource-exhaustion', group: 'security', run: resourceExhaustionRun },
      { name: 'validate-sensitive-data-leaks', group: 'security', run: sensitiveDataLeaksRun },
    ],
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
    description: 'Sitemap, robots, indexability, URL coverage.',
    tasks: [
      { name: 'generate-sitemap', group: 'indexing', run: generateSitemapRun },
      { name: 'validate-sitemap', group: 'indexing', run: validateSitemapRun },
      { name: 'validate-robots', group: 'indexing', run: validateRobotsRun },
      { name: 'validate-indexability', group: 'indexing', run: validateIndexabilityRun },
      { name: 'validate-url-coverage', group: 'indexing', run: validateUrlCoverageRun },
    ],
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
