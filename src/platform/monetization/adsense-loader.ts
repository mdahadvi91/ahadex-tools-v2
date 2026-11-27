/**
 * Client-side Google AdSense loader.
 *
 * Strictly gated by `getAdSlotEligibility()` so the AdSense tag is injected
 * ONLY when a valid `VITE_ADSENSE_PUBLISHER_ID` is configured AND the visitor
 * has granted advertising consent.
 */

import { getAdSlotEligibility } from './index';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

const ADSENSE_SCRIPT_ATTR = 'data-ahadex-adsense';

export function ensureAdSenseScriptLoaded(): boolean {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return false;
  }

  const eligibility = getAdSlotEligibility();
  if (!eligibility.enabled || !eligibility.publisherId) {
    return false;
  }

  const existing = document.querySelector(`script[${ADSENSE_SCRIPT_ATTR}]`);
  if (existing) {
    return true;
  }

  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
    eligibility.publisherId,
  )}`;
  script.setAttribute(ADSENSE_SCRIPT_ATTR, eligibility.publisherId);
  document.head.appendChild(script);
  return true;
}

export function pushAdSenseSlot(): void {
  if (typeof window === 'undefined') return;
  try {
    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.push({});
  } catch {
    // Ignore adblocker or duplicate slot initialization errors silently.
  }
}
