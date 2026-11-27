export interface Environment {
  readonly siteUrl: string;
  readonly isProduction: boolean;
  readonly isDevelopment: boolean;
  readonly gaMeasurementId: string | null;
  readonly adsensePublisherId: string | null;
  readonly clarityProjectId: string | null;
}

const PROD_FALLBACK_SITE_URL = 'https://ahadex.online';
const DEV_FALLBACK_SITE_URL = 'http://localhost:3000';
const DEFAULT_CLARITY_PROJECT_ID = 'zkc26mkuvb';
const ADSENSE_ID_PATTERN = /^ca-pub-\d{16}$/;
const GA_ID_PATTERN = /^G-[A-Z0-9]{6,}$/;
const CLARITY_ID_PATTERN = /^[a-z0-9]{6,24}$/i;

function isValidHttpsUrl(value: string): boolean {
  if (!value.startsWith('https://')) return false;
  if (value.endsWith('/')) return false;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:') return false;
    if (parsed.pathname !== '/' && parsed.pathname !== '') return false;
    if (parsed.search !== '' || parsed.hash !== '') return false;
    return true;
  } catch {
    return false;
  }
}

function readOptionalId(raw: string | undefined): string | null {
  if (raw === undefined) return null;
  const trimmed = raw.trim();
  return trimmed === '' ? null : trimmed;
}

function resolveClarityId(raw: string | undefined): string | null {
  if (raw === undefined) return DEFAULT_CLARITY_PROJECT_ID;
  const trimmed = raw.trim();
  if (trimmed === '') return DEFAULT_CLARITY_PROJECT_ID;
  if (/^(?:off|none|false|disabled)$/i.test(trimmed)) return null;
  return trimmed;
}

// Vite exposes PROD/DEV as booleans, other runtimes may pass strings.
function isFlagSet(value: unknown): boolean {
  return value === true || value === 'true';
}

function buildEnvironment(): Environment {
  const glob = globalThis as unknown as { process?: { env?: Record<string, string | undefined> } };
  const nodeEnv = glob.process?.env || {};

  const viteProd = typeof import.meta !== 'undefined' && isFlagSet(import.meta.env?.PROD);
  const viteDev = typeof import.meta !== 'undefined' && isFlagSet(import.meta.env?.DEV);

  const isProduction = viteProd || nodeEnv.NODE_ENV === 'production';
  const isDevelopment =
    !isProduction &&
    (viteDev || nodeEnv.NODE_ENV === 'development' || nodeEnv.NODE_ENV === undefined);

  const viteSiteUrl =
    typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SITE_URL : undefined;
  const rawSiteUrl = String(viteSiteUrl ?? nodeEnv.VITE_SITE_URL ?? '').trim();
  const siteUrl =
    rawSiteUrl === ''
      ? isProduction
        ? PROD_FALLBACK_SITE_URL
        : DEV_FALLBACK_SITE_URL
      : rawSiteUrl;

  const viteGaId =
    typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GA_MEASUREMENT_ID : undefined;
  const viteAdsenseId =
    typeof import.meta !== 'undefined' ? import.meta.env?.VITE_ADSENSE_PUBLISHER_ID : undefined;
  const viteClarityId =
    typeof import.meta !== 'undefined' ? import.meta.env?.VITE_CLARITY_PROJECT_ID : undefined;

  const gaMeasurementId = readOptionalId(viteGaId ?? nodeEnv.VITE_GA_MEASUREMENT_ID);
  const adsensePublisherId = readOptionalId(viteAdsenseId ?? nodeEnv.VITE_ADSENSE_PUBLISHER_ID);
  const clarityProjectId = resolveClarityId(viteClarityId ?? nodeEnv.VITE_CLARITY_PROJECT_ID);

  return Object.freeze({
    siteUrl,
    isProduction,
    isDevelopment,
    gaMeasurementId,
    adsensePublisherId,
    clarityProjectId,
  });
}

let cached: Environment | null = null;

export function getEnvironment(): Environment {
  if (cached === null) {
    cached = buildEnvironment();
  }
  return cached;
}

export function assertValidEnvironment(): void {
  const env = getEnvironment();

  if (env.isProduction) {
    if (env.siteUrl === '') {
      throw new Error('VITE_SITE_URL is required in production builds.');
    }
    if (!isValidHttpsUrl(env.siteUrl)) {
      throw new Error(
        `VITE_SITE_URL must be an https URL without trailing slash. Received: "${env.siteUrl}".`,
      );
    }
  }
  if (env.gaMeasurementId !== null && !GA_ID_PATTERN.test(env.gaMeasurementId)) {
    throw new Error(`VITE_GA_MEASUREMENT_ID is malformed: "${env.gaMeasurementId}".`);
  }
  if (env.adsensePublisherId !== null && !ADSENSE_ID_PATTERN.test(env.adsensePublisherId)) {
    throw new Error(`VITE_ADSENSE_PUBLISHER_ID is malformed: "${env.adsensePublisherId}".`);
  }
  if (env.clarityProjectId !== null && !CLARITY_ID_PATTERN.test(env.clarityProjectId)) {
    throw new Error(`VITE_CLARITY_PROJECT_ID is malformed: "${env.clarityProjectId}".`);
  }
}
