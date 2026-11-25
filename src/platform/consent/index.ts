/**
 * Client-side consent storage and state management.
 */

export interface ConsentState {
  readonly analytics: boolean;
  readonly ads: boolean;
  readonly updatedAt: string | null;
}

const STORAGE_KEY = 'ahadex_consent_v1';
export const CONSENT_CHANGE_EVENT = 'ahadex:consent-change';
export const OPEN_CONSENT_EVENT = 'ahadex:open-consent';

const DEFAULT_CONSENT: ConsentState = Object.freeze({
  analytics: false,
  ads: false,
  updatedAt: null,
});

let cachedRaw: string | null | undefined;
let cachedSnapshot: ConsentState = DEFAULT_CONSENT;

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function notifyConsentChange(state: ConsentState): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent<ConsentState>(CONSENT_CHANGE_EVENT, { detail: state }));
  } catch {
    // Ignore event dispatch errors in restricted environments
  }
}

export function readConsentState(): ConsentState {
  const storage = getStorage();
  if (!storage) return DEFAULT_CONSENT;

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) {
      return cachedSnapshot;
    }
    if (!raw) {
      cachedRaw = raw;
      cachedSnapshot = DEFAULT_CONSENT;
      return DEFAULT_CONSENT;
    }
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    const next = Object.freeze({
      analytics: Boolean(parsed.analytics),
      ads: Boolean(parsed.ads),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
    });
    cachedRaw = raw;
    cachedSnapshot = next;
    return next;
  } catch {
    return DEFAULT_CONSENT;
  }
}

export function getServerConsentSnapshot(): ConsentState {
  return DEFAULT_CONSENT;
}

export function subscribeConsent(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  const handleChange = () => onStoreChange();
  window.addEventListener(CONSENT_CHANGE_EVENT, handleChange);
  window.addEventListener('storage', handleChange);
  return () => {
    window.removeEventListener(CONSENT_CHANGE_EVENT, handleChange);
    window.removeEventListener('storage', handleChange);
  };
}

export function writeConsentState(next: Pick<ConsentState, 'analytics' | 'ads'>): ConsentState {
  const state: ConsentState = Object.freeze({
    analytics: Boolean(next.analytics),
    ads: Boolean(next.ads),
    updatedAt: new Date().toISOString(),
  });
  const serialized = JSON.stringify(state);
  cachedRaw = serialized;
  cachedSnapshot = state;

  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(STORAGE_KEY, serialized);
    } catch {
      // Ignore storage quota or private mode errors
    }
  }

  notifyConsentChange(state);
  return state;
}

export function resetConsentState(): ConsentState {
  cachedRaw = null;
  cachedSnapshot = DEFAULT_CONSENT;
  const storage = getStorage();
  if (storage) {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage removal errors
    }
  }

  notifyConsentChange(DEFAULT_CONSENT);
  return DEFAULT_CONSENT;
}

export function openConsentPreferences(): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(OPEN_CONSENT_EVENT));
  } catch {
    // Ignore event dispatch errors
  }
}

export function hasAnalyticsConsent(): boolean {
  return readConsentState().analytics;
}

export function hasAdsConsent(): boolean {
  return readConsentState().ads;
}
