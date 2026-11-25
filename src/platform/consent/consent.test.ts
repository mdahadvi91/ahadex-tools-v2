import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CONSENT_CHANGE_EVENT,
  OPEN_CONSENT_EVENT,
  hasAdsConsent,
  hasAnalyticsConsent,
  openConsentPreferences,
  readConsentState,
  resetConsentState,
  writeConsentState,
} from './index';

describe('consent storage module', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('defaults to analytics=false, ads=false, updatedAt=null', () => {
    expect(readConsentState()).toEqual({
      analytics: false,
      ads: false,
      updatedAt: null,
    });
    expect(hasAnalyticsConsent()).toBe(false);
    expect(hasAdsConsent()).toBe(false);
  });

  it('persists granular choices and emits CONSENT_CHANGE_EVENT', () => {
    const listener = vi.fn();
    window.addEventListener(CONSENT_CHANGE_EVENT, listener);

    const saved = writeConsentState({ analytics: true, ads: false });
    expect(saved.analytics).toBe(true);
    expect(saved.ads).toBe(false);
    expect(typeof saved.updatedAt).toBe('string');

    expect(hasAnalyticsConsent()).toBe(true);
    expect(hasAdsConsent()).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener(CONSENT_CHANGE_EVENT, listener);
  });

  it('resets stored consent cleanly and dispatches OPEN_CONSENT_EVENT', () => {
    writeConsentState({ analytics: true, ads: true });
    expect(hasAdsConsent()).toBe(true);

    const reset = resetConsentState();
    expect(reset).toEqual({ analytics: false, ads: false, updatedAt: null });
    expect(window.localStorage.getItem('ahadex_consent_v1')).toBeNull();

    const openListener = vi.fn();
    window.addEventListener(OPEN_CONSENT_EVENT, openListener);
    openConsentPreferences();
    expect(openListener).toHaveBeenCalledTimes(1);
    window.removeEventListener(OPEN_CONSENT_EVENT, openListener);
  });
});
