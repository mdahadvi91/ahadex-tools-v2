/**
 * Consent state for analytics and ads. Persisted in a single
 * first-party cookie. Nothing fires until consent is granted.
 */

import { deleteCookie, getCookie, setCookie } from './cookie-manager';

export type ConsentStatus = 'unknown' | 'granted' | 'denied';

export interface ConsentState {
  analytics: ConsentStatus;
  ads: ConsentStatus;
}

const COOKIE_NAME = 'ahx_consent';
const COOKIE_MAX_AGE_DAYS = 365;

const DEFAULT_STATE: ConsentState = Object.freeze({
  analytics: 'unknown',
  ads: 'unknown',
});

type Listener = (state: ConsentState) => void;

const listeners = new Set<Listener>();
let cached: ConsentState | null = null;

function loadFromCookie(): ConsentState {
  const raw = getCookie(COOKIE_NAME);
  if (!raw) return { ...DEFAULT_STATE };
  try {
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    return {
      analytics:
        parsed.analytics === 'granted' || parsed.analytics === 'denied'
          ? parsed.analytics
          : 'unknown',
      ads: parsed.ads === 'granted' || parsed.ads === 'denied' ? parsed.ads : 'unknown',
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function getConsent(): ConsentState {
  if (cached === null) cached = loadFromCookie();
  return cached;
}

export function setConsent(next: ConsentState): void {
  cached = { ...next };
  setCookie(COOKIE_NAME, JSON.stringify(cached), {
    maxAgeDays: COOKIE_MAX_AGE_DAYS,
    sameSite: 'Lax',
  });
  for (const listener of listeners) {
    try {
      listener(cached);
    } catch {
      // listener errors do not break consent updates
    }
  }
}

export function clearConsent(): void {
  cached = { ...DEFAULT_STATE };
  deleteCookie(COOKIE_NAME);
  for (const listener of listeners) {
    try {
      listener(cached);
    } catch {
      // ignore
    }
  }
}

export function isGranted(kind: keyof ConsentState): boolean {
  return getConsent()[kind] === 'granted';
}

export function subscribeConsent(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
