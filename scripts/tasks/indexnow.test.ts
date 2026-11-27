import { describe, expect, it } from 'vitest';
import { SITE_CONFIG } from '../../config/site.config';
import { buildIndexNowPayload, submitIndexNow, verifyIndexNowKeyFile } from './indexnow';

describe('IndexNow Bing/Yandex instant indexing configuration', () => {
  it('has a valid verification key file matching SITE_CONFIG.indexNowKey', () => {
    const verification = verifyIndexNowKeyFile();
    expect(verification.ok).toBe(true);
  });

  it('builds a valid IndexNow payload containing all indexable sitemap URLs', async () => {
    const payload = await buildIndexNowPayload();
    expect(payload.host).toBe(SITE_CONFIG.domain);
    expect(payload.key).toBe(SITE_CONFIG.indexNowKey);
    expect(payload.keyLocation).toBe(`${SITE_CONFIG.origin}/${SITE_CONFIG.indexNowKey}.txt`);
    expect(payload.urlList.length).toBeGreaterThanOrEqual(10);
    expect(payload.urlList).toContain(`${SITE_CONFIG.origin}/`);
    expect(payload.urlList).toContain(`${SITE_CONFIG.origin}/image-compressor/`);
    expect(payload.urlList).toContain(`${SITE_CONFIG.origin}/pdf-compressor/`);
  });

  it('runs dry-run submission cleanly without network calls', async () => {
    const result = await submitIndexNow({ dryRun: true });
    expect(result.status).toBe('DRY_RUN');
    expect(result.urlCount).toBe(result.payload.urlList.length);
  });
});
