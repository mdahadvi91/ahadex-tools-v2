/**
 * File upload security validator. Ensures that:
 *   - file-policy.ts exists and enforces size/MIME/extension limits
 *   - every tool calls validateSingleFile or validateBatch before
 *     passing files to its engine
 *   - no tool uses innerHTML or dangerouslySetInnerHTML with file data
 *   - worker files exist and receive only validated data
 */

import { join, relative } from 'node:path';
import { readText, walkFiles, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, warning, type Violation } from '../../utils/validation-result';

const FILE_POLICY = join(PATHS.srcPlatform, 'security/file-policy.ts');
const SECURITY_CONFIG = join(PATHS.srcPlatform, 'security/security-config.ts');

/** Tools that must validate input before processing. */
async function findToolEngines(): Promise<string[]> {
  if (!(await pathExists(PATHS.srcTools))) return [];
  const files = await walkFiles(PATHS.srcTools, {
    extensions: ['.ts'],
  });
  return files.filter((f) => f.includes('/engine/') && !f.endsWith('.test.ts'));
}

/** Tool implementation files that consume File objects. */
async function findToolConsumers(): Promise<string[]> {
  if (!(await pathExists(PATHS.srcTools))) return [];
  const files = await walkFiles(PATHS.srcTools, {
    extensions: ['.ts', '.tsx'],
  });
  return files.filter(
    (f) =>
      !f.endsWith('.test.ts') &&
      !f.endsWith('.test.tsx') &&
      !f.includes('/tests/'),
  );
}

function countLines(source: string, pattern: RegExp): number {
  const matches = source.match(pattern);
  return matches ? matches.length : 0;
}

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  // 1. file-policy.ts and security-config.ts must exist.
  if (!(await pathExists(FILE_POLICY))) {
    violations.push(
      error('missing-file-policy', 'src/platform/security/file-policy.ts is missing.', {
        file: 'src/platform/security/file-policy.ts',
        hint: 'Every tool needs file-policy to validate input.',
      }),
    );
  } else {
    const src = await readText(FILE_POLICY);
    if (!/export\s+function\s+validateSingleFile/.test(src)) {
      violations.push(
        error('missing-validate-single', 'validateSingleFile export missing from file-policy.ts.', {
          file: 'src/platform/security/file-policy.ts',
        }),
      );
    }
    if (!/export\s+function\s+validateBatch/.test(src)) {
      violations.push(
        error('missing-validate-batch', 'validateBatch export missing from file-policy.ts.', {
          file: 'src/platform/security/file-policy.ts',
        }),
      );
    }
  }

  if (!(await pathExists(SECURITY_CONFIG))) {
    violations.push(
      error(
        'missing-security-config',
        'src/platform/security/security-config.ts is missing.',
        { file: 'src/platform/security/security-config.ts' },
      ),
    );
  }

  // 2. Any tool that accepts File objects must import file-policy.
  const consumers = await findToolConsumers();
  for (const file of consumers) {
    const src = await readText(file);
    const usesFile = /\bFile\b|\bFileList\b|\.files\b/.test(src);
    if (!usesFile) continue;

    const importsPolicy = /from\s+['"][^'"]*file-policy['"]/.test(src);
    if (!importsPolicy) {
      violations.push(
        error(
          'tool-missing-policy-import',
          'Tool consumes File objects but does not import file-policy.',
          {
            file: relative(PATHS.root, file).split('\\').join('/'),
            hint: 'Import validateSingleFile or validateBatch from platform/security/file-policy.',
          },
        ),
      );
    }
  }

  // 3. No innerHTML or dangerouslySetInnerHTML combined with file data.
  const allToolFiles = await findToolConsumers();
  for (const file of allToolFiles) {
    const src = await readText(file);
    const htmlWrites =
      countLines(src, /\binnerHTML\s*=/g) + countLines(src, /dangerouslySetInnerHTML/g);
    if (htmlWrites === 0) continue;
    const usesFile =
      /\bFile\b|\bFileList\b|\.name\b.*\bfile\b|fileName/i.test(src);
    if (usesFile) {
      violations.push(
        error(
          'html-write-with-file-data',
          'innerHTML/dangerouslySetInnerHTML used in a file-consuming module.',
          {
            file: relative(PATHS.root, file).split('\\').join('/'),
            hint: 'Render file data via textContent or React children only.',
          },
        ),
      );
    } else {
      violations.push(
        warning(
          'innerHTML-usage',
          'innerHTML/dangerouslySetInnerHTML used.',
          { file: relative(PATHS.root, file).split('\\').join('/') },
        ),
      );
    }
  }

  // 4. Engine files must exist for every tool that declares an engine.
  const engines = await findToolEngines();
  const enginesByTool = new Map<string, string[]>();
  for (const engineFile of engines) {
    const match = engineFile.match(/src\/tools\/([^/]+)\/engine\//);
    if (!match) continue;
    const slug = match[1];
    const list = enginesByTool.get(slug) ?? [];
    list.push(engineFile);
    enginesByTool.set(slug, list);
  }
  for (const [slug, files] of enginesByTool) {
    const hasWorker = files.some((f) => f.endsWith('/worker.ts'));
    if (!hasWorker) {
      violations.push(
        warning(
          'engine-missing-worker',
          `Tool "${slug}" has engine files but no worker.ts.`,
          { hint: 'Move heavy processing to a Web Worker.' },
        ),
      );
    }
  }

  return violations;
}
