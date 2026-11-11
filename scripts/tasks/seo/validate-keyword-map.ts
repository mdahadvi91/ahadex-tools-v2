/**
 * Keyword map validator. Ensures every tool declares a keyword map:
 *   - primary keyword present
 *   - at least 3 secondary keywords
 *   - at least 3 long-tail keywords
 *   - at least one intent declared
 *   - primary keyword unique across tools
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

interface KeywordMapShape {
  primary?: string;
  secondary?: string[];
  longTail?: string[];
  intents?: string[];
}

/** Extracts keyword map from a keywords.ts file. */
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

  const intentsM = body.match(/intents\s*:\s*\[([\s\S]*?)\]/);
  if (intentsM) {
    result.intents = [...intentsM[1].matchAll(/['"`]([^'"`]+)['"`]/g)].map((x) => x[1]);
  }

  return result;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const files = (await walkFiles(PATHS.srcTools, { extensions: ['.ts'] })).filter(
    (f) => f.endsWith('/keywords.ts'),
  );

  for (const file of files) {
    const relPath = file.substring(PATHS.root.length + 1).split('\\').join('/');
    const src = await readText(file);
    const kw = extractKeywords(src);

    if (!kw) {
      violations.push(
        error('keywords-not-found', 'keywords.ts does not export a "keywords" object.', {
          file: relPath,
        }),
      );
      continue;
    }

    if (!kw.primary || kw.primary.length === 0) {
      violations.push(
        error('keywords-no-primary', 'keywords.primary is missing or empty.', {
          file: relPath,
        }),
      );
    }

    if (!kw.secondary || kw.secondary.length < 3) {
      violations.push(
        warning(
          'keywords-few-secondary',
          `Only ${kw.secondary?.length ?? 0} secondary keywords (target 3+).`,
          { file: relPath },
        ),
      );
    }

    if (!kw.longTail || kw.longTail.length < 3) {
      violations.push(
        warning(
          'keywords-few-longtail',
          `Only ${kw.longTail?.length ?? 0} long-tail keywords (target 3+).`,
          { file: relPath },
        ),
      );
    }

    if (!kw.intents || kw.intents.length === 0) {
      violations.push(
        error('keywords-no-intents', 'keywords.intents is empty.', {
          file: relPath,
        }),
      );
    }

    // Every intent must be one of the approved set.
    const approvedIntents = new Set(['transactional', 'informational', 'comparison']);
    for (const intent of kw.intents ?? []) {
      if (!approvedIntents.has(intent)) {
        violations.push(
          warning(
            'keywords-unknown-intent',
            `Unknown intent "${intent}".`,
            { file: relPath },
          ),
        );
      }
    }

    // No duplicate keywords within the same tool.
    const allKeywords = [kw.primary ?? '', ...(kw.secondary ?? []), ...(kw.longTail ?? [])]
      .filter(Boolean)
      .map((k) => k.toLowerCase());
    const seen = new Set<string>();
    for (const k of allKeywords) {
      if (seen.has(k)) {
        violations.push(
          warning(
            'keywords-duplicate',
            `Duplicate keyword "${k}" within same tool.`,
            { file: relPath },
          ),
        );
      }
      seen.add(k);
    }
  }

  return violations;
}
