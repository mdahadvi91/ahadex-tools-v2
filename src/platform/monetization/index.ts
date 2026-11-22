/**
 * Monetization / ad eligibility helper gated by publisher config and ad consent.
 */

import { getEnvironment } from '../../config/environment';
import { hasAdsConsent } from '../consent';

export interface AdSlotEligibility {
  readonly enabled: boolean;
  readonly publisherId: string | null;
  readonly reason: 'ready' | 'missing_publisher_id' | 'consent_not_granted';
}

export function getAdSlotEligibility(): AdSlotEligibility {
  const env = getEnvironment();

  if (!env.adsensePublisherId) {
    return {
      enabled: false,
      publisherId: null,
      reason: 'missing_publisher_id',
    };
  }

  if (!hasAdsConsent()) {
    return {
      enabled: false,
      publisherId: env.adsensePublisherId,
      reason: 'consent_not_granted',
    };
  }

  return {
    enabled: true,
    publisherId: env.adsensePublisherId,
    reason: 'ready',
  };
}
