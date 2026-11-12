/**
 * ads.txt validator. Once the AdSense publisher ID is issued, this
 * file ensures public/ads.txt exists with the correct format.
 *
 * If VITE_ADSENSE_PUBLISHER_ID is not set, this validator skips
 * gracefully — the site is not yet monetized.
 */

import { join } from 'node:path';
import { readText, pathExists } from '../../utils/file-system';
import { PATHS } from '../../utils/constants';
import { error, info, warning, type Violation } from '../../utils/validation-result';

/** AdSense record line format:
 *   google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
 */
const ADSENSE_LINE_RE = /^\s*google\.com\s*,\s*pub-\d{16}\s*,\s*DIRECT\s*,\s*f08c47fec0942fa0\s*$/;

export async function run(): Promise<Violation[]> {
  const violations: Violation[] = [];

  const publisherId = process.env.VITE_ADSENSE_PUBLISHER_ID?.trim();
  if (!publisherId) {
    return [
      info('ads-txt-skipped', 'VITE_ADSENSE_PUBLISHER_ID is not set. ads.txt validation skipped.'),
    ];
  }

  const adsTxtPath = join(PATHS.public, 'ads.txt');
  if (!(await pathExists(adsTxtPath))) {
    return [
      error('ads-txt-missing', 'public/ads.txt is missing but publisher ID is configured.', {
        file: 'public/ads.txt',
        hint: 'Create ads.txt with the AdSense record line.',
      }),
    ];
  }

  const content = await readText(adsTxtPath);
  const lines = content.split('\n');

  // Rule 1: at least one valid Google record.
  const hasValidLine = lines.some((line) => ADSENSE_LINE_RE.test(line));
  if (!hasValidLine) {
    violations.push(
      error('ads-txt-no-google-record', 'ads.txt has no valid Google AdSense record.', {
        file: 'public/ads.txt',
        hint: 'Add: google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0',
      }),
    );
  }

  // Rule 2: publisher ID matches env.
  const envPubId = publisherId.replace(/^ca-/, '');
  const hasMatchingId = lines.some((line) => line.includes(envPubId));
  if (!hasMatchingId) {
    violations.push(
      error(
        'ads-txt-publisher-mismatch',
        `ads.txt does not contain configured publisher ID "${envPubId}".`,
        { file: 'public/ads.txt' },
      ),
    );
  }

  // Rule 3: no duplicate records.
  const googleLines = lines.filter((l) => l.trim().startsWith('google.com'));
  if (googleLines.length > 1) {
    violations.push(
      warning(
        'ads-txt-duplicate-record',
        `ads.txt has ${googleLines.length} google.com records (expected 1).`,
        { file: 'public/ads.txt' },
      ),
    );
  }

  if (violations.length === 0) {
    violations.push(info('ads-txt-ok', 'ads.txt is valid and matches the publisher ID.'));
  }

  return violations;
}
