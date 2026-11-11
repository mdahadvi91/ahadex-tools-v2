/**
 * Public analytics API. Wraps adapter, consent gating and privacy
 * filtering. Safe to call from any component.
 */

import { isGranted, subscribeConsent } from '../privacy/consent-manager';
import { getFeatureFlags } from '../../config/feature-flags';
import { getAnalyticsProvider } from './adapter';
import { validateEvent } from './event-schema';
import { filterPayload } from './privacy-filter';

let initialized = false;

function ensureInitialized(): void {
  if (initialized) return;
  const flags = getFeatureFlags();
  if (!flags.analytics) return;
  if (!isGranted('analytics')) return;
  getAnalyticsProvider().init();
  initialized = true;
}

subscribeConsent(() => {
  initialized = false;
  ensureInitialized();
});

export function trackPageView(path: string, title: string): void {
  ensureInitialized();
  if (!isGranted('analytics')) return;
  getAnalyticsProvider().pageView(path, title);
}

export function trackEvent(name: string, payload: Record<string, unknown>): void {
  ensureInitialized();
  if (!isGranted('analytics')) return;
  const validation = validateEvent(name, payload);
  if (!validation.ok) return;
  const safePayload = filterPayload(payload);
  getAnalyticsProvider().track(name, safePayload);
}
