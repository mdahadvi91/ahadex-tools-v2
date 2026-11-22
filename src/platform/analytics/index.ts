/**
 * Privacy-aware client analytics wrapper gated by consent and environment config.
 */

import { getEnvironment } from '../../config/environment';
import { hasAnalyticsConsent } from '../consent';

export type AnalyticsEventName =
  | 'tool_opened'
  | 'file_selected'
  | 'processing_completed'
  | 'processing_failed'
  | 'result_downloaded';

export interface AnalyticsPayload {
  readonly [key: string]: string | number | boolean | undefined;
}

export function canTrackAnalytics(): boolean {
  const env = getEnvironment();
  return env.gaMeasurementId !== null && hasAnalyticsConsent();
}

export function trackEvent(eventName: AnalyticsEventName, payload: AnalyticsPayload = {}): void {
  if (!canTrackAnalytics()) {
    return;
  }

  if (typeof window === 'undefined') {
    return;
  }

  const win = window as unknown as {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  };

  if (typeof win.gtag === 'function') {
    win.gtag('event', eventName, payload);
  } else if (Array.isArray(win.dataLayer)) {
    win.dataLayer.push({ event: eventName, ...payload });
  }
}
