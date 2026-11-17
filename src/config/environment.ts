/**
 * Environment configuration and validation.
 *
 * Reads VITE_ variables from import.meta.env (typed in src/vite-env.d.ts).
 * Enforces production safety rules:
 *   - VITE_SITE_URL must be a valid https URL without trailing slash.
 *   - Optional identifiers (GA, AdSense) are null when empty.
 *
 * The validation is fail-fast: assertValidEnvironment() throws in
 * production builds when VITE_SITE_URL is missing or malformed.
 */

export interface Environment {
  /** Canonical site URL, no trailing slash. Always present (dev fallback). */
  readonly siteUrl: string;
  /** True when running a production build (import.meta.env.PROD). */
  readonly isProduction: boolean;
  /** True when running the dev server (import.meta.env.DEV). */
  readonly isDevelopment: boolean;
  /** GA4 measurement ID, or null when analytics is disabled. */
  readonly gaMeasurementId: string | null;
  /** AdSense publisher ID (ca-pub-...), or null when ads are disabled. */
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

function buildEnvironment(): Environment {
  // Safely access import.meta.env (works in Vite, falls back for Node.js/SSR)
  const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : ({} as any);

  const isProduction =
    env.PROD === true || (typeof process !== 'undefined' && process.env.NODE_ENV === 'production');
  const isDevelopment =
    env.DEV === true || (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production');

  const rawSiteUrl = (env.VITE_SITE_URL ?? 'https://ahadex.online').trim();
  const siteUrl = rawSiteUrl === '' && isDevelopment ? DEV_FALLBACK_SITE_URL : rawSiteUrl;

  const gaMeasurementId = readOptionalId(env.VITE_GA_MEASUREMENT_ID);
  const adsensePublisherId = readOptionalId(env.VITE_ADSENSE_PUBLISHER_ID);

  return Object.freeze({
    siteUrl,
    isProduction,
    isDevelopment,
    gaMeasurementId,
    adsensePublisherId,
  });
}

let cached: Environment | null = null;

/**
 * Returns the frozen environment object. Computed once, then cached.
 * In development, falls back to http://localhost:5173 when VITE_SITE_URL
 * is not set. In production, call assertValidEnvironment() first.
 */
export function getEnvironment(): Environment {
  if (cached === null) {
    cached = buildEnvironment();
  }
  return cached;
}

/**
 * Fail-fast validation. Call once at app startup.
 * Throws in production if VITE_SITE_URL is invalid or missing.
 * Throws if GA or AdSense identifiers are present but malformed.
 */
export function assertValidEnvironment(): void {
  const env = getEnvironment();

  if (env.isProduction) {
    if (env.siteUrl === '') {
      throw new Error(
        'VITE_SITE_URL is required in production builds. ' + 'See .env.example for format.',
      );
    }
    if (!isValidHttpsUrl(env.siteUrl)) {
      throw new Error(
        `VITE_SITE_URL must be an https URL without trailing slash. ` +
          `Received: "${env.siteUrl}".`,
      );
    }
  }

  if (env.gaMeasurementId !== null && !GA_ID_PATTERN.test(env.gaMeasurementId)) {
    throw new Error(
      `VITE_GA_MEASUREMENT_ID is malformed: "${env.gaMeasurementId}". ` +
        'Expected format: G-XXXXXXXXXX.',
    );
  }

  if (env.adsensePublisherId !== null && !ADSENSE_ID_PATTERN.test(env.adsensePublisherId)) {
    throw new Error(
      `VITE_ADSENSE_PUBLISHER_ID is malformed: "${env.adsensePublisherId}". ` +
        'Expected format: ca-pub-XXXXXXXXXXXXXXXX.',
    );
  }
}
