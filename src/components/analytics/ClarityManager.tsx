import { useEffect, useSyncExternalStore } from 'react';
import { getEnvironment } from '../../config/environment';
import {
  ensureClarityScriptLoaded,
  revokeClarityConsent,
} from '../../platform/analytics/clarity-loader';
import {
  getServerConsentSnapshot,
  readConsentState,
  subscribeConsent,
} from '../../platform/consent';

/**
 * Watches visitor consent state and activates Microsoft Clarity only when
 * a valid `clarityProjectId` is configured and analytics consent is granted.
 */
export default function ClarityManager() {
  const consent = useSyncExternalStore(
    subscribeConsent,
    readConsentState,
    getServerConsentSnapshot,
  );

  useEffect(() => {
    const env = getEnvironment();
    if (!env.clarityProjectId) return;

    if (consent.analytics) {
      ensureClarityScriptLoaded();
    } else {
      revokeClarityConsent();
    }
  }, [consent.analytics]);

  return null;
}
