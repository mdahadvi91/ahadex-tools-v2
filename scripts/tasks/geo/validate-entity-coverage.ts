/**
 * GEO entity coverage validator. Ensures content mentions the
 * entities that answer engines expect for the tool's topic:
 *   - The tool name appears in the first 100 chars of content
 *   - Input and output formats are named explicitly
 *   - Named technologies (Canvas, Web Worker) are mentioned
 *   - Privacy stance is explicitly stated
 *
 * Coverage of named entities improves citation by LLMs and answer
 * engines.
 */

import { walkFiles, readText } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { warning, type Violation } from '../../utils/validation-result';

interface EntityExpectation {
  name: string;
  patterns: readonly RegExp[];
  required: boolean;
  hint: string;
}

const COMMON_EXPECTATIONS: readonly EntityExpectation[] = [
  {
    name: 'tool-name',
    patterns: [/compressor|resizer|merger|splitter|converter/i],
    required: true,
    hint: 'Name the tool explicitly in the first paragraph.',
  },
  {
    name: 'privacy-statement',
    patterns: [/\bprivacy\b/i, /\blocal(?:ly)?\b/i, /\byour device\b/i, /\bnever (?:leaves?|uploaded?)\b/i],
    required: true,
    hint: 'State the privacy stance explicitly.',
  },
  {
    name: 'browser-technology',
    patterns: [/\b(?:Canvas|Web Worker|WebAssembly|WASM|File API)\b/i],
    required: false,
    hint: 'Name the underlying browser technology for technical credibility.',
  },
  {
    name: 'format-specification',
    patterns: [/\b(?:JPG|JPEG|PNG|WebP|AVIF|GIF|PDF)\b/i],
    required: true,
    hint: 'List supported formats explicitly.',
  },
  {
    name: 'size-limit',
    patterns: [/\b\d+\s*(?:MB|KB|GB)\b/i],
    required: false,
    hint: 'State any file size limits.',
  },
  {
    name: 'no-signup',
    patterns: [/\bno (?:signup|account|registration|login)\b/i, /\bwithout (?:signup|account|registration)\b/i],
    required: false,
    hint: 'State whether a signup is required.',
  },
];

function checkCoverage(content: string, expectation: EntityExpectation): boolean {
  return expectation.patterns.some((p) => p.test(content));
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const contentFiles = (await walkFiles(PATHS.srcTools, { extensions: ['.ts'] })).filter(
    (f) => f.endsWith('/content.ts'),
  );

  for (const file of contentFiles) {
    const relPath = file.substring(PATHS.root.length + 1).split('\\').join('/');
    const slug = relPath.match(/tools\/([^/]+)\//)?.[1] ?? 'unknown';
    const src = await readText(file);

    // Rule 1: check each common expectation.
    for (const expectation of COMMON_EXPECTATIONS) {
      const covered = checkCoverage(src, expectation);
      if (!covered) {
        if (expectation.required) {
          violations.push(
            warning(
              `coverage-missing-${expectation.name}`,
              `Tool "${slug}" does not cover expected entity: ${expectation.name}.`,
              {
                file: relPath,
                hint: expectation.hint,
              },
            ),
          );
        }
      }
    }

    // Rule 2: tool name in first 100 chars of DIRECT_ANSWER.
    const directAnswerMatch = src.match(
      /DIRECT_ANSWER\s*=\s*(?:\n\s*)?['"`]([^'"`]+)['"`]/,
    );
    if (directAnswerMatch) {
      const first100 = directAnswerMatch[1].slice(0, 100).toLowerCase();
      const toolNameWord = slug.replace(/-/g, ' ').toLowerCase().split(' ')[0];
      if (!first100.includes(toolNameWord)) {
        violations.push(
          warning(
            'coverage-name-not-first',
            `Tool "${slug}" DIRECT_ANSWER does not name the tool in the first 100 chars.`,
            {
              file: relPath,
              hint: 'Lead with the entity name for AI citation.',
            },
          ),
        );
      }
    }

    // Rule 3: coverage of expected input formats.
    const expectedFormatCoverage: Record<string, readonly string[]> = {
      'image-compressor': ['JPG', 'PNG', 'WebP'],
      'image-resizer': ['JPG', 'PNG', 'WebP'],
      'merge-pdf': ['PDF'],
      'split-pdf': ['PDF'],
      'pdf-compressor': ['PDF'],
    };
    const expected = expectedFormatCoverage[slug];
    if (expected) {
      for (const fmt of expected) {
        const re = new RegExp(`\\b${fmt}\\b`, 'i');
        if (!re.test(src)) {
          violations.push(
            warning(
              'coverage-missing-format',
              `Tool "${slug}" does not mention expected format: ${fmt}.`,
              { file: relPath },
            ),
          );
        }
      }
    }
  }

  return violations;
}
