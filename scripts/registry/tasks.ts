import '../tasks/production/generate-metadata-bundle';
import '../tasks/production/generate-og-images';
import '../tasks/production/generate-static-html';
import '../tasks/production/generate-tool-icons';

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

import { run as validateImportBoundariesRun } from '../tasks/architecture/validate-import-boundaries';
import { run as validateCircularDependenciesRun } from '../tasks/architecture/validate-circular-dependencies';
import { run as validateModulePurityRun } from '../tasks/architecture/validate-module-purity';
import { run as validateToolIsolationRun } from '../tasks/architecture/validate-tool-isolation';
import { run as validateRouteOwnershipRun } from '../tasks/architecture/validate-route-ownership';
import { run as validateRegistryIntegrityRun } from '../tasks/architecture/validate-registry-integrity';
import { run as validateDependencyGraphRun } from '../tasks/architecture/validate-dependency-graph';

import { run as validateCookieConsentRun } from '../tasks/privacy/validate-cookie-consent';
import { run as validateConsentEnforcementRun } from '../tasks/privacy/validate-consent-enforcement';
import { run as validatePrivacyLinksRun } from '../tasks/privacy/validate-privacy-links';
import { run as validateDataMinimizationRun } from '../tasks/privacy/validate-data-minimization';
import { run as validateTrackingPrivacyRun } from '../tasks/privacy/validate-tracking-privacy';

import { run as validateEventSchemaRun } from '../tasks/analytics/validate-event-schema';
import { run as validateEventPrivacyRun } from '../tasks/analytics/validate-event-privacy';
import { run as validateConsentTrackingRun } from '../tasks/analytics/validate-consent-tracking';
import { run as validateAnalyticsConfigRun } from '../tasks/analytics/validate-analytics-config';

import { run as validateBundleSizeRun } from '../tasks/performance/validate-bundle-size';

import { run as validateOgImagesRun } from '../tasks/assets/validate-og-images';
import { run as validateImageAssetsRun } from '../tasks/assets/validate-image-assets';
import { run as validateImageAltRun } from '../tasks/assets/validate-image-alt';
import { run as validateAssetReferencesRun } from '../tasks/assets/validate-asset-references';
import { run as validateUnusedAssetsRun } from '../tasks/assets/validate-unused-assets';

import { run as validateSeoConfigRun } from '../tasks/seo/validate-seo-config';
import { run as validateMetadataRun } from '../tasks/seo/validate-metadata';
import { run as validateCanonicalRun } from '../tasks/seo/validate-canonical';
import { run as validateSocialMetaRun } from '../tasks/seo/validate-social-meta';
import { run as validateKeywordMapRun } from '../tasks/seo/validate-keyword-map';
import { run as validateKeywordCannibalizationRun } from '../tasks/seo/validate-keyword-cannibalization';
import { run as validateSearchIntentRun } from '../tasks/seo/validate-search-intent';
import { run as validateInternalLinksRun } from '../tasks/seo/validate-internal-links';
import { run as validateOrphanPagesRun } from '../tasks/seo/validate-orphan-pages';
import { run as validateRedirectsRun } from '../tasks/seo/validate-redirects';
import { run as validateRedirectChainsRun } from '../tasks/seo/validate-redirect-chains';
import { run as validateIndexBloatRun } from '../tasks/seo/validate-index-bloat';

import { run as validateContentFilesRun } from '../tasks/content/validate-content-files';
import { run as validateContentStructureRun } from '../tasks/content/validate-content-structure';
import { run as validateHeadingHierarchyRun } from '../tasks/content/validate-heading-hierarchy';
import { run as validateFaqContentRun } from '../tasks/content/validate-faq-content';
import { run as validateContentQualityRun } from '../tasks/content/validate-content-quality';
import { run as validateDuplicateContentRun } from '../tasks/content/validate-duplicate-content';
import { run as validateContentFreshnessRun } from '../tasks/content/validate-content-freshness';
import { run as validateContentSourcesRun } from '../tasks/content/validate-content-sources';
import { run as validateTopicClustersRun } from '../tasks/content/validate-topic-clusters';
import { run as validateContentInventoryRun } from '../tasks/growth/validate-content-inventory';
import { run as validateLinkTargetsRun } from '../tasks/growth/validate-link-targets';
import { run as validateExternalLinksRun } from '../tasks/growth/validate-external-links';
import { run as validateBrandConsistencyRun } from '../tasks/growth/validate-brand-consistency';
import { run as generateKeywordReportRun } from '../tasks/growth/generate-keyword-report';
import { run as validateLocaleConfigRun } from '../tasks/i18n/validate-locale-config';
import { run as validateTranslationsRun } from '../tasks/i18n/validate-translations';
import { run as validateHreflangRun } from '../tasks/i18n/validate-hreflang';
import { run as validateLocaleMetadataRun } from '../tasks/i18n/validate-locale-metadata';
import { run as validateEditorialAttributionRun } from '../tasks/content/validate-editorial-attribution';

import { run as validateJsonldRun } from '../tasks/schema/validate-jsonld';
import { run as validateSchemaTypesRun } from '../tasks/schema/validate-schema-types';
import { run as validateSchemaUrlsRun } from '../tasks/schema/validate-schema-urls';
import { run as validateSchemaDuplicatesRun } from '../tasks/schema/validate-schema-duplicates';
import { run as validateSchemaConsistencyRun } from '../tasks/schema/validate-schema-consistency';

import { run as validateEntityConsistencyRun } from '../tasks/geo/validate-entity-consistency';
import { run as validateAnswerStructureRun } from '../tasks/geo/validate-answer-structure';
import { run as validateAiReadabilityRun } from '../tasks/geo/validate-ai-readability';
import { run as validateFactualContentRun } from '../tasks/geo/validate-factual-content';
import { run as validateEntityCoverageRun } from '../tasks/geo/validate-entity-coverage';

import { run as validateSemanticHtmlRun } from '../tasks/accessibility/validate-semantic-html';
import { run as validateKeyboardAccessRun } from '../tasks/accessibility/validate-keyboard-access';
import { run as validateAriaRun } from '../tasks/accessibility/validate-aria';
import { run as accessibilityAuditRun } from '../tasks/accessibility/accessibility-audit';
import { run as validateFocusOrderRun } from '../tasks/accessibility/validate-focus-order';
import { run as validateColorContrastRun } from '../tasks/accessibility/validate-color-contrast';

import { run as validateAdsTxtRun } from '../tasks/adsense/validate-ads-txt';
import { run as validateAdPlacementRun } from '../tasks/adsense/validate-ad-placement';
import { run as validateAdLabelsRun } from '../tasks/adsense/validate-ad-labels';
import { run as validateContentPolicyChecklistRun } from '../tasks/adsense/validate-content-policy-checklist';
import { run as validatePublisherConfigRun } from '../tasks/adsense/validate-publisher-config';

import { run as validateBuildRun } from '../tasks/production/validate-build';
import { run as validatePrerenderRun } from '../tasks/production/validate-prerender';
import { run as validateStaticHtmlRun } from '../tasks/production/validate-static-html';
import { run as validateRouteOutputRun } from '../tasks/production/validate-route-output';
import { run as validateArtifactIntegrityRun } from '../tasks/production/validate-artifact-integrity';
import { run as validateBrowserCompatibilityRun } from '../tasks/production/validate-browser-compatibility';
import { run as validateWorkerLifecycleRun } from '../tasks/production/validate-worker-lifecycle';
import { run as validateErrorIsolationRun } from '../tasks/production/validate-error-isolation';
import { run as lighthouseAuditRun } from '../tasks/production/lighthouse-audit';
import { run as validateWebVitalsRun } from '../tasks/performance/validate-web-vitals';
import { run as validateResourceBudgetRun } from '../tasks/performance/validate-resource-budget';
import { run as validateThirdPartyBudgetRun } from '../tasks/performance/validate-third-party-budget';
import { run as validateLazyLoadingRun } from '../tasks/performance/validate-lazy-loading';

// Import the new production tasks

export const TASKS: TaskRegistry = Object.freeze({
  architecture: {
    name: 'architecture',
    description: 'Import boundaries, cycles, module purity, registry integrity.',
    tasks: [
      {
        name: 'validate-import-boundaries',
        group: 'architecture',
        run: validateImportBoundariesRun,
      },
      {
        name: 'validate-circular-dependencies',
        group: 'architecture',
        run: validateCircularDependenciesRun,
      },
      { name: 'validate-module-purity', group: 'architecture', run: validateModulePurityRun },
      { name: 'validate-tool-isolation', group: 'architecture', run: validateToolIsolationRun },
      { name: 'validate-route-ownership', group: 'architecture', run: validateRouteOwnershipRun },
      {
        name: 'validate-registry-integrity',
        group: 'architecture',
        run: validateRegistryIntegrityRun,
      },
      { name: 'validate-dependency-graph', group: 'architecture', run: validateDependencyGraphRun },
    ],
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
    tasks: [
      { name: 'validate-seo-config', group: 'seo', run: validateSeoConfigRun },
      { name: 'validate-metadata', group: 'seo', run: validateMetadataRun },
      { name: 'validate-canonical', group: 'seo', run: validateCanonicalRun },
      { name: 'validate-social-meta', group: 'seo', run: validateSocialMetaRun },
      { name: 'validate-keyword-map', group: 'seo', run: validateKeywordMapRun },
      {
        name: 'validate-keyword-cannibalization',
        group: 'seo',
        run: validateKeywordCannibalizationRun,
      },
      { name: 'validate-search-intent', group: 'seo', run: validateSearchIntentRun },
      { name: 'validate-internal-links', group: 'seo', run: validateInternalLinksRun },
      { name: 'validate-orphan-pages', group: 'seo', run: validateOrphanPagesRun },
      { name: 'validate-redirects', group: 'seo', run: validateRedirectsRun },
      { name: 'validate-redirect-chains', group: 'seo', run: validateRedirectChainsRun },
      { name: 'validate-index-bloat', group: 'seo', run: validateIndexBloatRun },
    ],
  },
  content: {
    name: 'content',
    description: 'Structure, headings, FAQs, quality, freshness, attribution.',
    tasks: [
      { name: 'validate-content-files', group: 'content', run: validateContentFilesRun },
      { name: 'validate-content-structure', group: 'content', run: validateContentStructureRun },
      { name: 'validate-heading-hierarchy', group: 'content', run: validateHeadingHierarchyRun },
      { name: 'validate-faq-content', group: 'content', run: validateFaqContentRun },
      { name: 'validate-content-quality', group: 'content', run: validateContentQualityRun },
      { name: 'validate-duplicate-content', group: 'content', run: validateDuplicateContentRun },
      { name: 'validate-content-freshness', group: 'content', run: validateContentFreshnessRun },
      { name: 'validate-content-sources', group: 'content', run: validateContentSourcesRun },
      { name: 'validate-topic-clusters', group: 'content', run: validateTopicClustersRun },
      {
        name: 'validate-editorial-attribution',
        group: 'content',
        run: validateEditorialAttributionRun,
      },
    ],
  },
  geo: {
    name: 'geo',
    description: 'Entity consistency, answer structure, AI readability.',
    tasks: [
      { name: 'validate-entity-consistency', group: 'geo', run: validateEntityConsistencyRun },
      { name: 'validate-answer-structure', group: 'geo', run: validateAnswerStructureRun },
      { name: 'validate-ai-readability', group: 'geo', run: validateAiReadabilityRun },
      { name: 'validate-factual-content', group: 'geo', run: validateFactualContentRun },
      { name: 'validate-entity-coverage', group: 'geo', run: validateEntityCoverageRun },
    ],
  },
  schema: {
    name: 'schema',
    description: 'JSON-LD validity, types, URLs, duplicates, consistency.',
    tasks: [
      { name: 'validate-jsonld', group: 'schema', run: validateJsonldRun },
      { name: 'validate-schema-types', group: 'schema', run: validateSchemaTypesRun },
      { name: 'validate-schema-urls', group: 'schema', run: validateSchemaUrlsRun },
      { name: 'validate-schema-duplicates', group: 'schema', run: validateSchemaDuplicatesRun },
      { name: 'validate-schema-consistency', group: 'schema', run: validateSchemaConsistencyRun },
    ],
  },
  assets: {
    name: 'assets',
    description: 'OG images, image assets, alt text, references, unused.',
    tasks: [
      { name: 'validate-og-images', group: 'assets', run: validateOgImagesRun },
      { name: 'validate-image-assets', group: 'assets', run: validateImageAssetsRun },
      { name: 'validate-image-alt', group: 'assets', run: validateImageAltRun },
      { name: 'validate-asset-references', group: 'assets', run: validateAssetReferencesRun },
      { name: 'validate-unused-assets', group: 'assets', run: validateUnusedAssetsRun },
    ],
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
    tasks: [
      { name: 'validate-content-inventory', group: 'growth', run: validateContentInventoryRun },
      { name: 'validate-link-targets', group: 'growth', run: validateLinkTargetsRun },
      { name: 'validate-external-links', group: 'growth', run: validateExternalLinksRun },
      { name: 'validate-brand-consistency', group: 'growth', run: validateBrandConsistencyRun },
      { name: 'generate-keyword-report', group: 'growth', run: generateKeywordReportRun },
    ],
  },
  privacy: {
    name: 'privacy',
    description: 'Cookie consent, enforcement, privacy links, data minimization.',
    tasks: [
      { name: 'validate-cookie-consent', group: 'privacy', run: validateCookieConsentRun },
      {
        name: 'validate-consent-enforcement',
        group: 'privacy',
        run: validateConsentEnforcementRun,
      },
      { name: 'validate-privacy-links', group: 'privacy', run: validatePrivacyLinksRun },
      { name: 'validate-data-minimization', group: 'privacy', run: validateDataMinimizationRun },
      { name: 'validate-tracking-privacy', group: 'privacy', run: validateTrackingPrivacyRun },
    ],
  },
  accessibility: {
    name: 'accessibility',
    description: 'Semantic HTML, keyboard, ARIA, focus, color contrast.',
    tasks: [
      { name: 'validate-semantic-html', group: 'accessibility', run: validateSemanticHtmlRun },
      { name: 'validate-keyboard-access', group: 'accessibility', run: validateKeyboardAccessRun },
      { name: 'validate-aria', group: 'accessibility', run: validateAriaRun },
      { name: 'accessibility-audit', group: 'accessibility', run: accessibilityAuditRun },
      { name: 'validate-focus-order', group: 'accessibility', run: validateFocusOrderRun },
      { name: 'validate-color-contrast', group: 'accessibility', run: validateColorContrastRun },
    ],
  },
  performance: {
    name: 'performance',
    description: 'Bundle size, Web Vitals, resource and third-party budgets.',
    tasks: [
      { name: 'validate-bundle-size', group: 'performance', run: validateBundleSizeRun },
      { name: 'validate-web-vitals', group: 'performance', run: validateWebVitalsRun },
      { name: 'validate-resource-budget', group: 'performance', run: validateResourceBudgetRun },
      {
        name: 'validate-third-party-budget',
        group: 'performance',
        run: validateThirdPartyBudgetRun,
      },
      { name: 'validate-lazy-loading', group: 'performance', run: validateLazyLoadingRun },
    ],
  },
  analytics: {
    name: 'analytics',
    description: 'Event schema, privacy, consent tracking, analytics config.',
    tasks: [
      { name: 'validate-event-schema', group: 'analytics', run: validateEventSchemaRun },
      { name: 'validate-event-privacy', group: 'analytics', run: validateEventPrivacyRun },
      { name: 'validate-consent-tracking', group: 'analytics', run: validateConsentTrackingRun },
      { name: 'validate-analytics-config', group: 'analytics', run: validateAnalyticsConfigRun },
    ],
  },
  i18n: {
    name: 'i18n',
    description: 'Locale config, translations, hreflang, locale metadata.',
    tasks: [
      { name: 'validate-locale-config', group: 'i18n', run: validateLocaleConfigRun },
      { name: 'validate-translations', group: 'i18n', run: validateTranslationsRun },
      { name: 'validate-hreflang', group: 'i18n', run: validateHreflangRun },
      { name: 'validate-locale-metadata', group: 'i18n', run: validateLocaleMetadataRun },
    ],
  },
  adsense: {
    name: 'adsense',
    description: 'ads.txt, ad placement, labels, content policy, publisher.',
    tasks: [
      { name: 'validate-ads-txt', group: 'adsense', run: validateAdsTxtRun },
      { name: 'validate-ad-placement', group: 'adsense', run: validateAdPlacementRun },
      { name: 'validate-ad-labels', group: 'adsense', run: validateAdLabelsRun },
      {
        name: 'validate-content-policy-checklist',
        group: 'adsense',
        run: validateContentPolicyChecklistRun,
      },
      { name: 'validate-publisher-config', group: 'adsense', run: validatePublisherConfigRun },
    ],
  },
  production: {
    name: 'production',
    description: 'Build, prerender, static HTML, route output, Lighthouse.',
    tasks: [
      { name: 'validate-build', group: 'production', run: validateBuildRun },
      { name: 'validate-prerender', group: 'production', run: validatePrerenderRun },
      { name: 'validate-static-html', group: 'production', run: validateStaticHtmlRun },
      { name: 'validate-route-output', group: 'production', run: validateRouteOutputRun },
      {
        name: 'validate-artifact-integrity',
        group: 'production',
        run: validateArtifactIntegrityRun,
      },
      {
        name: 'validate-browser-compatibility',
        group: 'production',
        run: validateBrowserCompatibilityRun,
      },
      { name: 'validate-worker-lifecycle', group: 'production', run: validateWorkerLifecycleRun },
      { name: 'validate-error-isolation', group: 'production', run: validateErrorIsolationRun },
      { name: 'lighthouse-audit', group: 'production', run: lighthouseAuditRun },
    ],
  },
} as const);

export function getGroup(name: GroupName): GroupRegistry {
  return TASKS[name];
}

export function groupHasTasks(name: GroupName): boolean {
  return TASKS[name].tasks.length > 0;
}
