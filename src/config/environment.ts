export interface Environment {
  readonly siteUrl: string;
  readonly isProduction: boolean;
  readonly isDevelopment: boolean;
  readonly gaMeasurementId: string | null;
  readonly adsensePublisherId: string | null;
}

const DEV_FALLBACK_SITE_URL = 'http://localhost:5173';
const ADSENSE_ID_PATTERN = /^ca-pub-\d{16}$/;
const GA_ID_PATTERN = /^G-[A-Z0-9]{6,}$/;

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

// Vite exposes PROD/DEV as booleans, other runtimes may pass strings.
function isFlagSet(value: unknown): boolean {
  return value === true || value === 'true';
}

function buildEnvironment(): Environment {
  // Keep the literal `import.meta.env` expression: Vite replaces it statically in
  // production builds, so an aliased `import.meta` would be undefined at runtime.
  const metaEnv =
    (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
  const glob = globalThis as unknown as { process?: { env?: Record<string, string | undefined> } };
  const nodeEnv = glob.process?.env || {};

  const isProduction = isFlagSet(metaEnv.PROD) || nodeEnv.NODE_ENV === 'production';
  const isDevelopment =
    !isProduction &&
    (isFlagSet(metaEnv.DEV) ||
      nodeEnv.NODE_ENV === 'development' ||
      nodeEnv.NODE_ENV === undefined);

  const rawSiteUrl = String(metaEnv.VITE_SITE_URL ?? nodeEnv.VITE_SITE_URL ?? '').trim();
  const siteUrl = rawSiteUrl === '' && isDevelopment ? DEV_FALLBACK_SITE_URL : rawSiteUrl;

  const gaMeasurementId = readOptionalId(
    metaEnv.VITE_GA_MEASUREMENT_ID ?? nodeEnv.VITE_GA_MEASUREMENT_ID,
  );
  const adsensePublisherId = readOptionalId(
    metaEnv.VITE_ADSENSE_PUBLISHER_ID ?? nodeEnv.VITE_ADSENSE_PUBLISHER_ID,
  );

  return Object.freeze({
    siteUrl,
    isProduction,
    isDevelopment,
    gaMeasurementId,
    adsensePublisherId,
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
}
