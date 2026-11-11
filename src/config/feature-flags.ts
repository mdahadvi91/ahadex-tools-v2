/**
 * Compile-time feature flags. Values come from VITE_ env vars at
 * build time. Default is off unless explicitly enabled.
 */

import { getEnvironment } from './environment';

export interface FeatureFlags {
  readonly analytics: boolean;
  readonly ads: boolean;
}

export function getFeatureFlags(): FeatureFlags {
  const env = getEnvironment();
  return Object.freeze({
    analytics: env.gaMeasurementId !== null,
    ads: env.adsensePublisherId !== null,
  });
}
