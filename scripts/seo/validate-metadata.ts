/**
 * Metadata, SEO, Keywords, and Tool Asset validator.
 * Audits all static page configurations and filesystem-discovered tools
 * for title/description bounds, duplicate metadata, indexability consistency,
 * keywords completeness, and local icon/OG image asset declarations.
 */

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SITE_CONFIG, STATIC_PAGE_ROUTES, normalizeRoutePath } from '../../config/site.config';
import type { ToolManifest } from '../../src/config/tools';
import type { PageMetadata } from '../../src/platform/seo/metadata';
import type { ToolMetadata, ValidationIssue, ValidationReport } from '../../src/types/tool';
import { fileExists, resolveFromRoot } from '../utils/file-utils';
import { discoverToolsFromFilesystem } from '../utils/route-discovery';
import { assertReportPassed, createValidationReport } from '../utils/validation-utils';

interface KeywordMapLike {
  primary?: string;
  secondary?: readonly string[];
  longTail?: readonly string[];
}

export interface MetadataValidationInput {
  toolsRoot?: string;
}

export function validateMetadataBounds(
  label: string,
  title: string,
  description: string,
  target: string,
  issues: ValidationIssue[],
  bounds: { minTitle: number; maxTitle: number; minDesc: number; maxDesc: number },
): void {
  const cleanTitle = title.trim();
  const cleanDesc = description.trim();

  if (!cleanTitle) {
    issues.push({
      code: 'SEO_EMPTY_TITLE',
      severity: 'critical',
      target,
      message: `${label} title is empty.`,
    });
  } else {
    if (cleanTitle.length < 30 || cleanTitle.length > 75) {
      issues.push({
        code: 'SEO_TITLE_LENGTH_CRITICAL',
        severity: 'critical',
        target,
        message: `${label} title length (${cleanTitle.length}) is outside acceptable range 30-75 chars.`,
        hint: `Keep title between ${bounds.minTitle} and ${bounds.maxTitle} characters.`,
      });
    } else if (cleanTitle.length < bounds.minTitle || cleanTitle.length > bounds.maxTitle) {
      issues.push({
        code: 'SEO_TITLE_LENGTH_WARN',
        severity: 'warning',
        target,
        message: `${label} title length (${cleanTitle.length}) is outside ideal range ${bounds.minTitle}-${bounds.maxTitle} chars.`,
      });
    }
  }

  if (!cleanDesc) {
    issues.push({
      code: 'SEO_EMPTY_DESCRIPTION',
      severity: 'critical',
      target,
      message: `${label} description is empty.`,
    });
  } else {
    if (cleanDesc.length < 95 || cleanDesc.length > 175) {
      issues.push({
        code: 'SEO_DESC_LENGTH_CRITICAL',
        severity: 'critical',
        target,
        message: `${label} description length (${cleanDesc.length}) is outside acceptable range 95-175 chars.`,
        hint: `Keep description between ${bounds.minDesc} and ${bounds.maxDesc} characters.`,
      });
    } else if (cleanDesc.length < bounds.minDesc || cleanDesc.length > bounds.maxDesc) {
      issues.push({
        code: 'SEO_DESC_LENGTH_WARN',
        severity: 'warning',
        target,
        message: `${label} description length (${cleanDesc.length}) is outside ideal range ${bounds.minDesc}-${bounds.maxDesc} chars.`,
      });
    }
  }
}

export async function runMetadataValidation(
  options: MetadataValidationInput = {},
): Promise<ValidationReport> {
  const issues: ValidationIssue[] = [];
  const seenTitles = new Map<string, string>();
  const seenDescriptions = new Map<string, string>();
  let checkedCount = 0;

  for (const staticRoute of STATIC_PAGE_ROUTES) {
    checkedCount++;
    const target = `static:${staticRoute.slug}`;
    validateMetadataBounds(
      'Static page',
      staticRoute.title,
      staticRoute.description,
      target,
      issues,
      {
        minTitle: 28,
        maxTitle: 68,
        minDesc: 100,
        maxDesc: 160,
      },
    );

    const titleKey = staticRoute.title.trim().toLowerCase();
    const descKey = staticRoute.description.trim().toLowerCase();
    if (seenTitles.has(titleKey)) {
      issues.push({
        code: 'SEO_DUPLICATE_TITLE',
        severity: 'critical',
        target,
        message: `Duplicate title shares exact text with ${seenTitles.get(titleKey)}.`,
      });
    } else {
      seenTitles.set(titleKey, target);
    }

    if (seenDescriptions.has(descKey)) {
      issues.push({
        code: 'SEO_DUPLICATE_DESCRIPTION',
        severity: 'critical',
        target,
        message: `Duplicate description shares exact text with ${seenDescriptions.get(descKey)}.`,
      });
    } else {
      seenDescriptions.set(descKey, target);
    }
  }

  const tools = await discoverToolsFromFilesystem(options.toolsRoot);
  if (tools.length === 0) {
    issues.push({
      code: 'SEO_NO_TOOLS_DISCOVERED',
      severity: 'critical',
      message: 'No tool directories discovered under src/tools/.',
    });
  }

  for (const tool of tools) {
    checkedCount++;
    const target = `tool:${tool.slug}`;

    if (!tool.implemented) {
      issues.push({
        code: 'TOOL_UNINITIALIZED',
        severity: 'critical',
        target,
        message: `Tool "${tool.slug}" is incomplete or still contains TODO stubs.`,
      });
      continue;
    }

    const manifestUrl = pathToFileURL(path.join(tool.directory, 'manifest.ts')).href;
    const metadataUrl = pathToFileURL(path.join(tool.directory, 'metadata.ts')).href;
    const seoUrl = pathToFileURL(path.join(tool.directory, 'seo.ts')).href;
    const keywordsUrl = pathToFileURL(path.join(tool.directory, 'keywords.ts')).href;

    const manifestMod = (await import(manifestUrl)) as { manifest?: ToolManifest };
    const metadataMod = fileExists(path.join(tool.directory, 'metadata.ts'))
      ? ((await import(metadataUrl)) as { metadata?: ToolMetadata })
      : {};
    const seoMod = fileExists(path.join(tool.directory, 'seo.ts'))
      ? ((await import(seoUrl)) as { metadata?: PageMetadata; ogImageAlt?: string })
      : {};
    const keywordsMod = fileExists(path.join(tool.directory, 'keywords.ts'))
      ? ((await import(keywordsUrl)) as { keywords?: KeywordMapLike })
      : {};

    const manifest = manifestMod.manifest;
    const toolMeta = metadataMod.metadata;
    const seoMeta = seoMod.metadata;
    const keywords = keywordsMod.keywords;

    if (!manifest) {
      issues.push({
        code: 'TOOL_MISSING_MANIFEST',
        severity: 'critical',
        target,
        message: 'manifest.ts does not export `manifest`.',
      });
      continue;
    }

    if (manifest.slug !== tool.slug) {
      issues.push({
        code: 'TOOL_SLUG_MISMATCH',
        severity: 'critical',
        target,
        message: `manifest.slug ("${manifest.slug}") does not match directory ("${tool.slug}").`,
      });
    }

    const expectedPath = normalizeRoutePath(`/${tool.slug}/`);
    if (manifest.path !== expectedPath) {
      issues.push({
        code: 'TOOL_PATH_MISMATCH',
        severity: 'critical',
        target,
        message: `manifest.path ("${manifest.path}") must equal "${expectedPath}".`,
      });
    }

    validateMetadataBounds('Tool manifest', manifest.title, manifest.description, target, issues, {
      minTitle: 50,
      maxTitle: 70,
      minDesc: 120,
      maxDesc: 160,
    });

    if (!toolMeta) {
      issues.push({
        code: 'TOOL_MISSING_METADATA',
        severity: 'critical',
        target,
        message: 'Missing metadata.ts export (`metadata`).',
      });
    } else {
      if (toolMeta.canonical !== `${SITE_CONFIG.origin}${expectedPath}`) {
        issues.push({
          code: 'TOOL_CANONICAL_DRIFT',
          severity: 'critical',
          target,
          message: `metadata.canonical ("${toolMeta.canonical}") must match "${SITE_CONFIG.origin}${expectedPath}".`,
        });
      }
      if (toolMeta.iconPath) {
        const iconDiskPath = resolveFromRoot(toolMeta.iconPath.replace(/^\/+/, ''));
        if (!fileExists(iconDiskPath)) {
          issues.push({
            code: 'TOOL_MISSING_ICON',
            severity: 'critical',
            target,
            message: `Declared icon asset does not exist: ${toolMeta.iconPath}`,
          });
        }
      } else {
        issues.push({
          code: 'TOOL_UNDECLARED_ICON',
          severity: 'warning',
          target,
          message: 'metadata.iconPath is not defined.',
        });
      }

      if (toolMeta.ogImagePath) {
        const ogDiskPath = resolveFromRoot(toolMeta.ogImagePath.replace(/^\/+/, ''));
        if (!fileExists(ogDiskPath)) {
          issues.push({
            code: 'TOOL_MISSING_OG_ASSET',
            severity: 'warning',
            target,
            message: `Declared OG source asset not found on disk yet: ${toolMeta.ogImagePath}`,
            hint: 'Generate or populate tool OG image assets in Phase 7.',
          });
        }
      }
    }

    if (!seoMeta) {
      issues.push({
        code: 'TOOL_MISSING_SEO_MODULE',
        severity: 'critical',
        target,
        message: 'Missing seo.ts export (`metadata`).',
      });
    } else {
      validateMetadataBounds('Tool SEO', seoMeta.title, seoMeta.description, target, issues, {
        minTitle: 50,
        maxTitle: 65,
        minDesc: 125,
        maxDesc: 160,
      });

      if (manifest.status === 'live' && manifest.indexable && seoMeta.noIndex) {
        issues.push({
          code: 'SEO_NOINDEX_CONTRADICTION',
          severity: 'critical',
          target,
          message: 'Live indexable tool has seo.noIndex = true.',
        });
      }

      const seoTitleKey = seoMeta.title.trim().toLowerCase();
      const seoDescKey = seoMeta.description.trim().toLowerCase();

      if (seenTitles.has(seoTitleKey)) {
        issues.push({
          code: 'SEO_DUPLICATE_TITLE',
          severity: 'critical',
          target,
          message: `Duplicate SEO title shares text with ${seenTitles.get(seoTitleKey)}.`,
        });
      } else {
        seenTitles.set(seoTitleKey, `${target}:seo`);
      }

      if (seenDescriptions.has(seoDescKey)) {
        issues.push({
          code: 'SEO_DUPLICATE_DESCRIPTION',
          severity: 'critical',
          target,
          message: `Duplicate SEO description shares text with ${seenDescriptions.get(seoDescKey)}.`,
        });
      } else {
        seenDescriptions.set(seoDescKey, `${target}:seo`);
      }

      if (!seoMod.ogImageAlt || seoMod.ogImageAlt.trim().length < 15) {
        issues.push({
          code: 'SEO_MISSING_OG_ALT',
          severity: 'warning',
          target,
          message: 'seo.ts should export a descriptive ogImageAlt string (>= 15 chars).',
        });
      }
    }

    if (!keywords || !keywords.primary || !keywords.secondary?.length) {
      issues.push({
        code: 'SEO_KEYWORDS_INCOMPLETE',
        severity: 'critical',
        target,
        message: 'keywords.ts must define `primary` and at least one `secondary` keyword.',
      });
    }
  }

  return createValidationReport('seo:metadata', checkedCount, issues);
}

const isDirectExecution =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  const strict = process.argv.includes('--strict');
  const report = await runMetadataValidation();
  assertReportPassed(report, strict);
}
