import { useEffect, useRef, useSyncExternalStore } from 'react';
import {
  getServerConsentSnapshot,
  readConsentState,
  subscribeConsent,
} from '../../platform/consent';
import { getAdSlotEligibility } from '../../platform/monetization';
import {
  ensureAdSenseScriptLoaded,
  pushAdSenseSlot,
} from '../../platform/monetization/adsense-loader';

interface AdSlotProps {
  readonly slot: 'home-mid' | 'tool-below-workspace';
}

/**
 * Policy-compliant, zero-CLS responsive AdSense slot.
 * Renders nothing when AdSense is not configured or advertising consent is not granted,
 * preventing empty placeholder boxes or deceptive layout gaps.
 */
export default function AdSlot({ slot }: AdSlotProps) {
  const consent = useSyncExternalStore(
    subscribeConsent,
    readConsentState,
    getServerConsentSnapshot,
  );
  const initializedRef = useRef(false);
  const eligibility = getAdSlotEligibility();

  const shouldRender = eligibility.enabled && Boolean(eligibility.publisherId) && consent.ads;

  useEffect(() => {
    if (!shouldRender || initializedRef.current) return;
    initializedRef.current = true;
    ensureAdSenseScriptLoaded();
    pushAdSenseSlot();
  }, [shouldRender]);

  if (!shouldRender || !eligibility.publisherId) {
    return null;
  }

  return (
    <aside
      aria-label="Advertisement"
      data-ad-slot-position={slot}
      className="mx-auto my-6 max-w-4xl px-4 sm:px-6"
    >
      <div className="min-h-[100px] rounded-xl border border-[#e6e2d8] bg-[#f4f1ea]/60 p-3 text-center">
        <p className="mb-2 text-[11px] font-medium tracking-wide text-slate-600">Advertisement</p>
        <ins
          className="adsbygoogle block min-h-[90px] w-full"
          data-ad-client={eligibility.publisherId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
}
