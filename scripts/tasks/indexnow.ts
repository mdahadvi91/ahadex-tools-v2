/**
 * Official IndexNow submission utility for AHADEX Tools.
 *
 * Submits all indexable canonical URLs discovered from the filesystem to
 * https://api.indexnow.org/indexnow so Bing, Yandex, Seznam, and Naver
 * discover updates immediately after deployment.
 *
 * Usage:
 *   npm run indexnow:submit -- --dry-run
 *   npm run indexnow:submit
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_CONFIG } from '../../config/site.config';
import { fileExists, readTextFile, resolveFromRoot } from '../utils/file-utils';
import { discoverPublishedRoutes } from '../utils/route-discovery';

export interface IndexNowPayload {
  readonly host: string;
  readonly key: string;
  readonly keyLocation: string;
  readonly urlList: readonly string[];
}

export async function buildIndexNowPayload(toolsRoot?: string): Promise<IndexNowPayload> {
  const routes = await discoverPublishedRoutes(toolsRoot);
  const urlList = routes.filter((r) => r.indexable && r.sitemap).map((r) => r.canonicalUrl);

  return {
    host: SITE_CONFIG.domain,
    key: SITE_CONFIG.indexNowKey,
    keyLocation: `${SITE_CONFIG.origin}/${SITE_CONFIG.indexNowKey}.txt`,
    urlList,
  };
}

export function verifyIndexNowKeyFile(publicDir: string = resolveFromRoot('public')): {
  ok: boolean;
  reason?: string;
} {
  const keyFilePath = path.join(publicDir, `${SITE_CONFIG.indexNowKey}.txt`);
  if (!fileExists(keyFilePath)) {
    return { ok: false, reason: `Missing IndexNow verification key file at ${keyFilePath}` };
  }
  const content = readTextFile(keyFilePath).trim();
  if (content !== SITE_CONFIG.indexNowKey) {
    return {
      ok: false,
      reason: `IndexNow key file mismatch: expected "${SITE_CONFIG.indexNowKey}", received "${content}".`,
    };
  }
  return { ok: true };
}

export async function submitIndexNow(
  options: { dryRun?: boolean; toolsRoot?: string } = {},
): Promise<{
  status: number | 'DRY_RUN';
  urlCount: number;
  payload: IndexNowPayload;
}> {
  const keyCheck = verifyIndexNowKeyFile();
  if (!keyCheck.ok) {
    throw new Error(keyCheck.reason);
  }

  const payload = await buildIndexNowPayload(options.toolsRoot);
  if (payload.urlList.length === 0) {
    throw new Error('IndexNow payload contains 0 indexable URLs.');
  }

  if (options.dryRun) {
    return {
      status: 'DRY_RUN',
      urlCount: payload.urlList.length,
      payload,
    };
  }

  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '');
    throw new Error(`IndexNow submission failed (${response.status}): ${bodyText}`);
  }

  return {
    status: response.status,
    urlCount: payload.urlList.length,
    payload,
  };
}

const isDirectExecution =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  const dryRun = process.argv.includes('--dry-run');
  const result = await submitIndexNow({ dryRun });
  if (dryRun) {
    console.log(`[DRY_RUN] IndexNow payload verified for ${result.urlCount} URLs:`);
    console.log(JSON.stringify(result.payload, null, 2));
  } else {
    console.log(
      `[PASS] IndexNow submitted ${result.urlCount} URLs cleanly (HTTP ${result.status}).`,
    );
  }
}
