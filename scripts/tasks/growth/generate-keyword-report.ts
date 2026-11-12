/**
 * Keyword report generator. Aggregates keyword maps from all tools
 * and writes a markdown report for SEO review.
 *
 * Not a validator: writes a report file and reports INFO.
 */

import { join } from 'node:path';
import { walkFiles, readText, writeText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { info, type Violation } from '../../utils/validation-result';

interface KeywordMapShape {
  primary?: string;
  secondary?: string[];
  longTail?: string[];
  intents?: string[];
}

function extractKeywords(src: string): KeywordMapShape | null {
  const m = src.match(/keywords\s*[^=]*=\s*(\{[\s\S]*?\n\});/);
  if (!m) return null;
  const body = m[1];
  const result: KeywordMapShape = {};

  const primaryM = body.match(/primary\s*:\s*['"`]([^'"`]+)['"`]/);
  if (primaryM) result.primary = primaryM[1];

  const secondaryM = body.match(/secondary\s*:\s*\[([\s\S]*?)\]/);
  if (secondaryM) {
    result.secondary = [...secondaryM[1].matchAll(/['"`]([^'"`]+)['"`]/g)].map((x) => x[1]);
  }

  const longTailM = body.match(/longTail\s*:\s*\[([\s\S]*?)\]/);
  if (longTailM) {
    result.longTail = [...longTailM[1].matchAll(/['"`]([^'"`]+)['"`]/g)].map((x) => x[1]);
  }

  const intentsM = body.match(/intents\s*:\s*\[([\s\S]*?)\]/);
  if (intentsM) {
    result.intents = [...intentsM[1].matchAll(/['"`]([^'"`]+)['"`]/g)].map((x) => x[1]);
  }

  return result;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const keywordFiles = (await walkFiles(PATHS.srcTools, { extensions: ['.ts'] })).filter((f) =>
    f.endsWith('/keywords.ts'),
  );

  if (keywordFiles.length === 0) {
    return [info('keyword-report-skipped', 'No keyword files found.')];
  }

  const entries: Array<{ slug: string; kw: KeywordMapShape }> = [];
  for (const file of keywordFiles) {
    const match = file.match(/tools\/([^/]+)\/keywords\.ts$/);
    if (!match) continue;
    const src = await readText(file);
    const kw = extractKeywords(src);
    if (kw) entries.push({ slug: match[1], kw });
  }

  if (entries.length === 0) {
    return [info('keyword-report-empty', 'No valid keyword maps parsed.')];
  }

  const lines: string[] = [];
  lines.push('# Keyword Report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Total tools: ${entries.length}`);
  const totalSecondary = entries.reduce((sum, e) => sum + (e.kw.secondary?.length ?? 0), 0);
  const totalLongTail = entries.reduce((sum, e) => sum + (e.kw.longTail?.length ?? 0), 0);
  lines.push(`- Secondary keywords: ${totalSecondary}`);
  lines.push(`- Long-tail keywords: ${totalLongTail}`);
  lines.push('');

  for (const entry of entries) {
    lines.push(`## ${entry.slug}`);
    lines.push('');
    if (entry.kw.primary) lines.push(`**Primary:** ${entry.kw.primary}`);
    if (entry.kw.intents && entry.kw.intents.length > 0) {
      lines.push(`**Intents:** ${entry.kw.intents.join(', ')}`);
    }
    if (entry.kw.secondary && entry.kw.secondary.length > 0) {
      lines.push(`**Secondary:** ${entry.kw.secondary.join(', ')}`);
    }
    if (entry.kw.longTail && entry.kw.longTail.length > 0) {
      lines.push(`**Long-tail:** ${entry.kw.longTail.join(', ')}`);
    }
    lines.push('');
  }

  const reportPath = join(PATHS.root, 'reports', 'keyword-report.md');
  await writeText(reportPath, lines.join('\n'));

  violations.push(
    info(
      'keyword-report-written',
      `Wrote keyword report to reports/keyword-report.md (${entries.length} tools).`,
    ),
  );

  return violations;
}
