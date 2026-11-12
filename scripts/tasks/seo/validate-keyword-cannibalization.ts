/**
 * Keyword cannibalization validator. Ensures two tools do not target
 * the same primary keyword, and that long-tail keywords overlap is
 * within reason.
 *
 * Cannibalization = two pages competing for the same search query.
 * It splits link equity and confuses ranking signals.
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

interface KeywordMapShape {
  primary?: string;
  secondary?: string[];
  longTail?: string[];
}

interface KeywordMapEntry {
  file: string;
  slug: string;
  keywords: KeywordMapShape;
}

function extractKeywords(src: string): KeywordMapShape | null {
  const m = src.match(/export\s+const\s+keywords[^=]*=\s*(\{[\s\S]*?\n\});/);
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
  return result;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const files = (await walkFiles(PATHS.srcTools, { extensions: ['.ts'] })).filter((f) =>
    f.endsWith('/keywords.ts'),
  );

  if (files.length < 2) return violations;

  const maps: KeywordMapEntry[] = [];
  for (const file of files) {
    const relPath = file
      .substring(PATHS.root.length + 1)
      .split('\\')
      .join('/');
    const slug = relPath.match(/tools\/([^/]+)\//)?.[1] ?? '';
    const src = await readText(file);
    const kw = extractKeywords(src);
    if (kw) maps.push({ file: relPath, slug, keywords: kw });
  }

  // Rule 1: no duplicate primary keywords.
  const primaryIndex = new Map<string, KeywordMapEntry>();
  for (const entry of maps) {
    const primary = entry.keywords.primary?.toLowerCase().trim();
    if (!primary) continue;
    if (primaryIndex.has(primary)) {
      const other = primaryIndex.get(primary)!;
      violations.push(
        error(
          'primary-cannibalization',
          `Primary keyword "${primary}" is also targeted by ${other.slug}.`,
          {
            file: entry.file,
            hint: 'Each tool must target a unique primary keyword.',
          },
        ),
      );
    } else {
      primaryIndex.set(primary, entry);
    }
  }

  // Rule 2: warn when long-tail overlap exceeds 30%.
  for (let i = 0; i < maps.length; i++) {
    for (let j = i + 1; j < maps.length; j++) {
      const a = maps[i];
      const b = maps[j];
      const aLT = new Set((a.keywords.longTail ?? []).map((k) => k.toLowerCase()));
      const bLT = new Set((b.keywords.longTail ?? []).map((k) => k.toLowerCase()));
      if (aLT.size === 0 || bLT.size === 0) continue;
      const overlap = [...aLT].filter((k) => bLT.has(k));
      const ratio = overlap.length / Math.min(aLT.size, bLT.size);
      if (ratio > 0.3) {
        violations.push(
          warning(
            'long-tail-overlap',
            `${Math.round(ratio * 100)}% long-tail overlap between ${a.slug} and ${b.slug}.`,
            {
              file: a.file,
              hint: `Shared: ${overlap.slice(0, 3).join(', ')}${overlap.length > 3 ? '...' : ''}`,
            },
          ),
        );
      }
    }
  }

  // Rule 3: warn when secondary keywords overlap completely.
  for (let i = 0; i < maps.length; i++) {
    for (let j = i + 1; j < maps.length; j++) {
      const a = maps[i];
      const b = maps[j];
      const aSec = new Set((a.keywords.secondary ?? []).map((k) => k.toLowerCase()));
      const bSec = new Set((b.keywords.secondary ?? []).map((k) => k.toLowerCase()));
      if (aSec.size === 0 || bSec.size === 0) continue;
      const overlap = [...aSec].filter((k) => bSec.has(k));
      if (overlap.length >= Math.min(aSec.size, bSec.size) * 0.5) {
        violations.push(
          warning(
            'secondary-overlap',
            `Secondary keywords overlap by ${overlap.length} terms between ${a.slug} and ${b.slug}.`,
            { file: a.file },
          ),
        );
      }
    }
  }

  return violations;
}
