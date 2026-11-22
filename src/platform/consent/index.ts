/**
 * Client-side consent storage and state management.
 */

export interface ConsentState {
  readonly analytics: boolean;
  readonly ads: boolean;
  readonly updatedAt: string | null;
}

const STORAGE_KEY = 'ahadex_consent_v1';

const DEFAULT_CONSENT: ConsentState = Object.freeze({
  analytics: false,
  ads: false,
  updatedAt: null,
});

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readConsentState(): ConsentState {
  const storage = getStorage();
  if (!storage) return DEFAULT_CONSENT;

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONSENT;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    return Object.freeze({
      analytics: Boolean(parsed.analytics),
      ads: Boolean(parsed.ads),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
    });
  } catch {
    return DEFAULT_CONSENT;
  }
}

export function writeConsentState(next: Pick<ConsentState, 'analytics' | 'ads'>): ConsentState {
  const state: ConsentState = Object.freeze({
    analytics: Boolean(next.analytics),
    ads: Boolean(next.ads),
    updatedAt: new Date().toISOString(),
  });

  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota or private mode errors
    }
  }

  return state;
}

export function hasAnalyticsConsent(): boolean {
  return readConsentState().analytics;
}

export function hasAdsConsent(): boolean {
  return readConsentState().ads;
}
