/**
 * JSON-LD Structured Data validator across all tool modules.
 * Verifies valid JSON serialization, schema.org context, WebApplication fields,
 * FAQPage synchronization with content.ts, and BreadcrumbList trailing-slash URLs.
 */

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SITE_CONFIG } from '../../config/site.config';
import type { ValidationIssue, ValidationReport } from '../../src/types/tool';
import { fileExists } from '../utils/file-utils';
import { discoverToolsFromFilesystem } from '../utils/route-discovery';
import { assertReportPassed, createValidationReport } from '../utils/validation-utils';

interface SchemaGraphShape {
  '@context'?: string;
  '@graph'?: Array<Record<string, unknown>>;
}

interface ContentFaqShape {
  FAQ?: readonly { question: string; answer: string }[];
}

export function validateToolSchemaGraph(
  schemaRaw: unknown,
  expectedUrl: string,
  expectedFaqCount: number,
  target: string,
  issues: ValidationIssue[],
): void {
  let parsed: SchemaGraphShape;
  try {
    parsed = JSON.parse(JSON.stringify(schemaRaw)) as SchemaGraphShape;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    issues.push({
      code: 'SCHEMA_NOT_SERIALIZABLE',
      severity: 'critical',
      target,
      message: `Schema cannot be cleanly JSON-serialized: ${message}`,
    });
    return;
  }

  if (parsed['@context'] !== 'https://schema.org') {
    issues.push({
      code: 'SCHEMA_INVALID_CONTEXT',
      severity: 'critical',
      target,
      message: `Expected @context "https://schema.org", received "${String(parsed['@context'])}".`,
    });
  }

  const graph = parsed['@graph'];
  if (!Array.isArray(graph) || graph.length === 0) {
    issues.push({
      code: 'SCHEMA_EMPTY_GRAPH',
      severity: 'critical',
      target,
      message: 'Schema must return a non-empty @graph array.',
    });
    return;
  }

  const webApp = graph.find((node) => node['@type'] === 'WebApplication');
  if (!webApp) {
    issues.push({
      code: 'SCHEMA_MISSING_WEBAPP',
      severity: 'critical',
      target,
      message: 'Schema @graph is missing a WebApplication node.',
    });
  } else {
    if (webApp.url !== expectedUrl) {
      issues.push({
        code: 'SCHEMA_WEBAPP_URL_MISMATCH',
        severity: 'critical',
        target,
        message: `WebApplication.url ("${String(webApp.url)}") must match "${expectedUrl}".`,
      });
    }
    const offers = webApp.offers as { price?: string; priceCurrency?: string } | undefined;
    if (!offers || offers.price !== '0' || !offers.priceCurrency) {
      issues.push({
        code: 'SCHEMA_WEBAPP_OFFERS_INVALID',
        severity: 'critical',
        target,
        message: 'WebApplication.offers must specify price "0" and priceCurrency.',
      });
    }
  }

  const faqPage = graph.find((node) => node['@type'] === 'FAQPage');
  if (!faqPage) {
    issues.push({
      code: 'SCHEMA_MISSING_FAQPAGE',
      severity: 'critical',
      target,
      message: 'Schema @graph is missing a FAQPage node.',
    });
  } else {
    const entities = faqPage.mainEntity as
      Array<{ '@type'?: string; name?: string; acceptedAnswer?: { text?: string } }> | undefined;
    if (!Array.isArray(entities) || entities.length === 0) {
      issues.push({
        code: 'SCHEMA_EMPTY_FAQ',
        severity: 'critical',
        target,
        message: 'FAQPage.mainEntity is empty.',
      });
    } else {
      if (expectedFaqCount > 0 && entities.length !== expectedFaqCount) {
        issues.push({
          code: 'SCHEMA_FAQ_COUNT_MISMATCH',
          severity: 'critical',
          target,
          message: `FAQPage count (${entities.length}) does not match content FAQ items (${expectedFaqCount}).`,
        });
      }
      for (const item of entities) {
        if (!item.name || !item.acceptedAnswer?.text) {
          issues.push({
            code: 'SCHEMA_FAQ_MALFORMED_ITEM',
            severity: 'critical',
            target,
            message: 'Every FAQPage Question must include non-empty name and acceptedAnswer.text.',
          });
          break;
        }
      }
    }
  }

  const breadcrumb = graph.find((node) => node['@type'] === 'BreadcrumbList');
  if (!breadcrumb) {
    issues.push({
      code: 'SCHEMA_MISSING_BREADCRUMB',
      severity: 'critical',
      target,
      message: 'Schema @graph is missing a BreadcrumbList node.',
    });
  } else {
    const items = breadcrumb.itemListElement as
      Array<{ position?: number; name?: string; item?: string }> | undefined;
    if (!Array.isArray(items) || items.length < 2) {
      issues.push({
        code: 'SCHEMA_BREADCRUMB_SHORT',
        severity: 'critical',
        target,
        message: 'BreadcrumbList must include at least Home and current tool entries.',
      });
    } else {
      if (items[0].item !== `${SITE_CONFIG.origin}/`) {
        issues.push({
          code: 'SCHEMA_BREADCRUMB_ROOT_MISMATCH',
          severity: 'critical',
          target,
          message: `First breadcrumb item must equal "${SITE_CONFIG.origin}/" (got "${String(items[0].item)}").`,
        });
      }
      const last = items[items.length - 1];
      if (last.item !== expectedUrl) {
        issues.push({
          code: 'SCHEMA_BREADCRUMB_LEAF_MISMATCH',
          severity: 'critical',
          target,
          message: `Final breadcrumb item must equal "${expectedUrl}" (got "${String(last.item)}").`,
        });
      }
    }
  }
}

export async function runSchemaValidation(toolsRoot?: string): Promise<ValidationReport> {
  const issues: ValidationIssue[] = [];
  const tools = await discoverToolsFromFilesystem(toolsRoot);
  let checkedCount = 0;

  for (const tool of tools) {
    if (!tool.implemented) continue;
    checkedCount++;
    const target = `tool:${tool.slug}`;

    const schemaPath = path.join(tool.directory, 'schema.ts');
    if (!fileExists(schemaPath)) {
      issues.push({
        code: 'SCHEMA_FILE_MISSING',
        severity: 'critical',
        target,
        message: 'Tool is missing schema.ts.',
      });
      continue;
    }

    const schemaMod = (await import(pathToFileURL(schemaPath).href)) as {
      buildSchema?: (siteUrl: string) => unknown;
    };

    if (typeof schemaMod.buildSchema !== 'function') {
      issues.push({
        code: 'SCHEMA_BUILDER_MISSING',
        severity: 'critical',
        target,
        message: 'schema.ts must export a buildSchema(siteUrl) function.',
      });
      continue;
    }

    let expectedFaqCount = 0;
    const contentPath = path.join(tool.directory, 'content.ts');
    if (fileExists(contentPath)) {
      const contentMod = (await import(pathToFileURL(contentPath).href)) as ContentFaqShape;
      expectedFaqCount = contentMod.FAQ?.length ?? 0;
    }

    const built = schemaMod.buildSchema(SITE_CONFIG.origin);
    validateToolSchemaGraph(built, tool.canonicalUrl, expectedFaqCount, target, issues);
  }

  return createValidationReport('seo:schema', checkedCount, issues);
}

const isDirectExecution =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  const strict = process.argv.includes('--strict');
  const report = await runSchemaValidation();
  assertReportPassed(report, strict);
}
