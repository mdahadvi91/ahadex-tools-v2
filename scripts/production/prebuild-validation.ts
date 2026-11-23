/**
 * Pre-build Validation Gate Orchestrator (Phase 10).
 *
 * Runs deterministic source-level validations (Environment, Route Discovery,
 * SEO Metadata, Canonical Hygiene, JSON-LD Schema, Content Depth & Claims,
 * and Robots/LLMs rules) BEFORE Vite or SSR compilation begins.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertValidEnvironment } from '../../src/config/environment';
import type { ValidationReport } from '../../src/types/tool';
import { runContentValidation } from '../content/validate-content';
import { runCanonicalValidation } from '../seo/validate-canonical';
import { runMetadataValidation } from '../seo/validate-metadata';
import { runSchemaValidation } from '../seo/validate-schema';
import { runRobotsAndLlmsValidation } from '../sitemap/validate-robots';
import { printValidationReport } from '../utils/validation-utils';
import { runRouteValidation } from '../validation/validate-routes';

export interface PrebuildSuiteResult {
  readonly passed: boolean;
  readonly durationMs: number;
  readonly reports: readonly ValidationReport[];
}

export async function runPrebuildValidation(): Promise<PrebuildSuiteResult> {
  const start = Date.now();
  assertValidEnvironment();

  const reports: ValidationReport[] = [
    await runRouteValidation({ verifyDist: false }),
    await runMetadataValidation(),
    await runCanonicalValidation(),
    await runSchemaValidation(),
    await runContentValidation(),
    await runRobotsAndLlmsValidation(),
  ];

  for (const report of reports) {
    printValidationReport(report);
  }

  const passed = reports.every((r) => r.status !== 'FAIL');
  return {
    passed,
    durationMs: Date.now() - start,
    reports,
  };
}

const isDirectExecution =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  const result = await runPrebuildValidation();
  if (!result.passed) {
    process.exitCode = 1;
    throw new Error('Pre-build validation failed. Fix critical issues before building.');
  }
  console.log(
    `[PASS] validate:pre — all ${result.reports.length} pre-build gates passed in ${result.durationMs}ms.`,
  );
}
