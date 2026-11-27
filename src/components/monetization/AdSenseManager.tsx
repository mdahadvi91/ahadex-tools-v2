import { useEffect, useSyncExternalStore } from 'react';
import {
  getServerConsentSnapshot,
  readConsentState,
  subscribeConsent,
} from '../../platform/consent';
import { getAdSlotEligibility } from '../../platform/monetization';
import { ensureAdSenseScriptLoaded } from '../../platform/monetization/adsense-loader';

/**
 * Watches consent state and initializes Google AdSense only when both a valid
 * `VITE_ADSENSE_PUBLISHER_ID` and user advertising consent are active.
 */
export default function AdSenseManager() {
  const consent = useSyncExternalStore(
    subscribeConsent,
    readConsentState,
    getServerConsentSnapshot,
  );

  useEffect(() => {
    const eligibility = getAdSlotEligibility();
    if (eligibility.enabled && consent.ads) {
      ensureAdSenseScriptLoaded();
    }
  }, [consent.ads]);

  return null;
}
