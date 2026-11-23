/**
 * Content quality, AdSense depth (>800 words), internal-link integrity,
 * and verifiable-claims validator across all tools and static informational pages.
 */

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { ValidationIssue, ValidationReport } from '../../src/types/tool';
import { fileExists, readTextFile, resolveFromRoot } from '../utils/file-utils';
import { discoverPublishedRoutes, discoverToolsFromFilesystem } from '../utils/route-discovery';
import { assertReportPassed, createValidationReport } from '../utils/validation-utils';

export interface ToolContentShape {
  HERO?: { h1?: string; tagline?: string; subtitle?: string };
  DIRECT_ANSWER?: string;
  SECTIONS?: readonly {
    heading: string;
    paragraphs: readonly string[];
    list?: readonly string[];
  }[];
  HOW_IT_WORKS?: readonly { step: number; title: string; body: string }[];
  USE_CASES?: readonly { title: string; body: string }[];
  PRIVACY?: { heading: string; paragraphs: readonly string[] };
  LIMITATIONS?: { heading: string; list: readonly string[] };
  FAQ?: readonly { question: string; answer: string }[];
  REFERENCES?: readonly { label: string; url: string; note: string }[];
  INTERNAL_LINKS?: readonly { label: string; path: string }[];
}

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0).length;
}

export function checkVerifiableClaims(
  allText: string,
  target: string,
  issues: ValidationIssue[],
): void {
  const lower = allText.toLowerCase();

  if (/\blorem ipsum\b|\bcoming soon\b|\btbd\b|\btodo\b/.test(lower)) {
    issues.push({
      code: 'CONTENT_PLACEHOLDER_DETECTED',
      severity: 'critical',
      target,
      message: 'Content contains placeholder wording (TODO, TBD, coming soon, or lorem ipsum).',
    });
  }

  if (/\b(?:world'?s (?:best|leading|first)|revolutionary|fastest|#1|number one)\b/.test(lower)) {
    issues.push({
      code: 'CONTENT_UNVERIFIED_SUPERLATIVE',
      severity: 'critical',
      target,
      message: 'Content uses prohibited unverified marketing superlatives.',
    });
  }

  const strippedGuarantee = lower.replace(/not guaranteed/g, '');
  if (/\bguaranteed\b|\bguarantee\b/.test(strippedGuarantee)) {
    issues.push({
      code: 'CONTENT_BARE_GUARANTEE',
      severity: 'critical',
      target,
      message: 'Content makes an absolute "guarantee/guaranteed" claim without qualification.',
    });
  }

  if (
    /\boffline\b/.test(lower) &&
    !/(not guaranteed|not currently|may continue|without internet)/.test(lower)
  ) {
    issues.push({
      code: 'CONTENT_UNQUALIFIED_OFFLINE',
      severity: 'warning',
      target,
      message: 'Mentions "offline" without clarifying service worker caching limits.',
    });
  }
}

export function inspectToolContentModule(
  content: ToolContentShape,
  validRoutePaths: ReadonlySet<string>,
  target: string,
  issues: ValidationIssue[],
): void {
  if (!content.HERO?.h1 || !content.HERO.tagline) {
    issues.push({
      code: 'CONTENT_MISSING_HERO',
      severity: 'critical',
      target,
      message: 'content.ts must export HERO.h1 and HERO.tagline.',
    });
  }

  if (!content.DIRECT_ANSWER || content.DIRECT_ANSWER.trim().length < 80) {
    issues.push({
      code: 'CONTENT_WEAK_DIRECT_ANSWER',
      severity: 'critical',
      target,
      message: 'DIRECT_ANSWER is missing or shorter than 80 characters.',
    });
  }

  const sections = content.SECTIONS ?? [];
  if (sections.length < 6) {
    issues.push({
      code: 'CONTENT_FEW_SECTIONS',
      severity: 'critical',
      target,
      message: `Tool needs at least 6 prose sections (found ${sections.length}).`,
    });
  }

  const faq = content.FAQ ?? [];
  if (faq.length < 8) {
    issues.push({
      code: 'CONTENT_FEW_FAQ',
      severity: 'critical',
      target,
      message: `Tool needs at least 8 FAQ items (found ${faq.length}).`,
    });
  }

  if ((content.HOW_IT_WORKS?.length ?? 0) < 3) {
    issues.push({
      code: 'CONTENT_FEW_STEPS',
      severity: 'critical',
      target,
      message: 'HOW_IT_WORKS must have at least 3 steps.',
    });
  }

  if ((content.LIMITATIONS?.list.length ?? 0) < 2) {
    issues.push({
      code: 'CONTENT_MISSING_LIMITATIONS',
      severity: 'critical',
      target,
      message: 'LIMITATIONS section must document at least 2 explicit limits.',
    });
  }

  const references = content.REFERENCES ?? [];
  if (references.length < 2) {
    issues.push({
      code: 'CONTENT_FEW_REFERENCES',
      severity: 'warning',
      target,
      message: 'Include at least 2 external HTTPS technical references.',
    });
  }
  for (const ref of references) {
    if (!ref.url.startsWith('https://')) {
      issues.push({
        code: 'CONTENT_INSECURE_REFERENCE',
        severity: 'critical',
        target,
        message: `Reference URL must use HTTPS: ${ref.url}`,
      });
    }
  }

  const internalLinks = content.INTERNAL_LINKS ?? [];
  if (internalLinks.length < 3) {
    issues.push({
      code: 'CONTENT_FEW_INTERNAL_LINKS',
      severity: 'critical',
      target,
      message: 'Provide at least 3 internal links to tools or core site pages.',
    });
  }
  for (const link of internalLinks) {
    if (!validRoutePaths.has(link.path)) {
      issues.push({
        code: 'CONTENT_BROKEN_INTERNAL_LINK',
        severity: 'critical',
        target,
        message: `Internal link "${link.path}" does not match any live published route.`,
      });
    }
  }

  const combinedProse = [
    content.HERO?.tagline ?? '',
    content.HERO?.subtitle ?? '',
    content.DIRECT_ANSWER ?? '',
    ...sections.flatMap((s) => [s.heading, ...s.paragraphs, ...(s.list ?? [])]),
    ...faq.flatMap((f) => [f.question, f.answer]),
  ].join(' ');

  const words = countWords(combinedProse);
  if (words < 800) {
    issues.push({
      code: 'CONTENT_THIN_WORD_COUNT',
      severity: 'critical',
      target,
      message: `Tool prose word count (${words}) is below the 800-word AdSense quality floor.`,
    });
  }

  checkVerifiableClaims(combinedProse, target, issues);
}

const REQUIRED_STATIC_PAGE_FILES = [
  'src/pages/About.tsx',
  'src/pages/Contact.tsx',
  'src/pages/PrivacyPolicy.tsx',
  'src/pages/Terms.tsx',
  'src/pages/Disclaimer.tsx',
  'src/pages/CookiePolicy.tsx',
] as const;

export async function runContentValidation(toolsRoot?: string): Promise<ValidationReport> {
  const issues: ValidationIssue[] = [];
  const seenH1s = new Map<string, string>();
  let checkedCount = 0;

  const publishedRoutes = await discoverPublishedRoutes(toolsRoot);
  const validRoutePaths = new Set(publishedRoutes.map((r) => r.path));

  for (const relPage of REQUIRED_STATIC_PAGE_FILES) {
    checkedCount++;
    const fullPath = resolveFromRoot(relPage);
    if (!fileExists(fullPath)) {
      issues.push({
        code: 'CONTENT_STATIC_PAGE_MISSING',
        severity: 'critical',
        target: relPage,
        message: `Required informational page missing: ${relPage}`,
      });
      continue;
    }
    const source = readTextFile(fullPath);
    if (source.includes('TODO:') || source.includes('Lorem ipsum')) {
      issues.push({
        code: 'CONTENT_STATIC_PAGE_PLACEHOLDER',
        severity: 'critical',
        target: relPage,
        message: `Informational page contains unfinished placeholder text.`,
      });
    }
    if (source.length < 400) {
      issues.push({
        code: 'CONTENT_STATIC_PAGE_THIN',
        severity: 'critical',
        target: relPage,
        message: `Informational page content appears overly thin (${source.length} chars).`,
      });
    }
  }

  const tools = await discoverToolsFromFilesystem(toolsRoot);
  for (const tool of tools) {
    if (!tool.implemented) continue;
    checkedCount++;
    const target = `tool:${tool.slug}`;
    const contentPath = path.join(tool.directory, 'content.ts');
    if (!fileExists(contentPath)) {
      issues.push({
        code: 'CONTENT_FILE_MISSING',
        severity: 'critical',
        target,
        message: 'Tool is missing content.ts.',
      });
      continue;
    }

    const mod = (await import(pathToFileURL(contentPath).href)) as ToolContentShape;
    inspectToolContentModule(mod, validRoutePaths, target, issues);

    const h1 = mod.HERO?.h1?.trim().toLowerCase();
    if (h1) {
      if (seenH1s.has(h1)) {
        issues.push({
          code: 'CONTENT_DUPLICATE_H1',
          severity: 'critical',
          target,
          message: `HERO.h1 "${mod.HERO?.h1}" duplicates ${seenH1s.get(h1)}.`,
        });
      } else {
        seenH1s.set(h1, target);
      }
    }
  }

  return createValidationReport('content:quality', checkedCount, issues);
}

const isDirectExecution =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  const strict = process.argv.includes('--strict');
  const report = await runContentValidation();
  assertReportPassed(report, strict);
}
