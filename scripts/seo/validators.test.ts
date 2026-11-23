import { describe, expect, it } from 'vitest';
import type { ValidationIssue } from '../../src/types/tool';
import {
  checkVerifiableClaims,
  inspectToolContentModule,
  runContentValidation,
} from '../content/validate-content';
import { hasTrailingSlashPolicyViolation, runCanonicalValidation } from './validate-canonical';
import { runMetadataValidation, validateMetadataBounds } from './validate-metadata';
import { runSchemaValidation, validateToolSchemaGraph } from './validate-schema';

describe('Phase 5 validators against live AHADEX codebase', () => {
  it('passes metadata, canonical, schema, and content checks without critical issues', async () => {
    const metaReport = await runMetadataValidation();
    expect(metaReport.issues.filter((i) => i.severity === 'critical')).toEqual([]);
    expect(metaReport.checkedCount).toBeGreaterThanOrEqual(12);

    const canonicalReport = await runCanonicalValidation();
    expect(canonicalReport.status).toBe('PASS');

    const schemaReport = await runSchemaValidation();
    expect(schemaReport.status).toBe('PASS');

    const contentReport = await runContentValidation();
    expect(contentReport.issues.filter((i) => i.severity === 'critical')).toEqual([]);
  });
});

describe('Phase 5 validators reject synthetic SEO and content defects', () => {
  it('flags invalid title/description bounds cleanly', () => {
    const issues: ValidationIssue[] = [];
    validateMetadataBounds('Test', 'Short', 'Too brief', 'tool:bad', issues, {
      minTitle: 50,
      maxTitle: 65,
      minDesc: 125,
      maxDesc: 160,
    });
    expect(issues.some((i) => i.code === 'SEO_TITLE_LENGTH_CRITICAL')).toBe(true);
    expect(issues.some((i) => i.code === 'SEO_DESC_LENGTH_CRITICAL')).toBe(true);
  });

  it('detects trailing slash policy violations', () => {
    expect(hasTrailingSlashPolicyViolation('/')).toBe(false);
    expect(hasTrailingSlashPolicyViolation('/pdf-compressor/')).toBe(false);
    expect(hasTrailingSlashPolicyViolation('/pdf-compressor')).toBe(true);
    expect(hasTrailingSlashPolicyViolation('pdf-compressor/')).toBe(true);
  });

  it('flags broken JSON-LD WebApplication or Breadcrumb URLs', () => {
    const issues: ValidationIssue[] = [];
    validateToolSchemaGraph(
      {
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'WebApplication', url: 'https://ahadex.online/bad', offers: { price: '0' } },
          { '@type': 'FAQPage', mainEntity: [] },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [{ position: 1, item: 'https://ahadex.online/' }],
          },
        ],
      },
      'https://ahadex.online/bad/',
      2,
      'tool:bad',
      issues,
    );
    expect(issues.some((i) => i.code === 'SCHEMA_WEBAPP_URL_MISMATCH')).toBe(true);
    expect(issues.some((i) => i.code === 'SCHEMA_EMPTY_FAQ')).toBe(true);
    expect(issues.some((i) => i.code === 'SCHEMA_BREADCRUMB_SHORT')).toBe(true);
  });

  it('catches thin content, broken internal links, and unverified claims', () => {
    const issues: ValidationIssue[] = [];
    inspectToolContentModule(
      {
        HERO: { h1: 'Bad Tool', tagline: 'Short tagline' },
        DIRECT_ANSWER: 'Too short',
        SECTIONS: [{ heading: 'One', paragraphs: ['Short paragraph.'] }],
        FAQ: [{ question: 'Why?', answer: 'Because.' }],
        HOW_IT_WORKS: [],
        LIMITATIONS: { heading: 'Limits', list: [] },
        REFERENCES: [],
        INTERNAL_LINKS: [{ label: 'Missing', path: '/does-not-exist/' }],
      },
      new Set(['/', '/about/']),
      'tool:bad',
      issues,
    );

    expect(issues.some((i) => i.code === 'CONTENT_THIN_WORD_COUNT')).toBe(true);
    expect(issues.some((i) => i.code === 'CONTENT_BROKEN_INTERNAL_LINK')).toBe(true);

    const claimIssues: ValidationIssue[] = [];
    checkVerifiableClaims(
      'This is the fastest tool with 100% guaranteed output.',
      'tool:claims',
      claimIssues,
    );
    expect(claimIssues.some((i) => i.code === 'CONTENT_UNVERIFIED_SUPERLATIVE')).toBe(true);
    expect(claimIssues.some((i) => i.code === 'CONTENT_BARE_GUARANTEE')).toBe(true);
  });
});
