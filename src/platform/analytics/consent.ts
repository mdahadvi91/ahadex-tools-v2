/**
 * Analytics-facing consent API. Re-exports from the canonical
 * privacy/consent-manager so callers importing from either path
 * get the same state.
 */

export {
  getConsent,
  setConsent,
  clearConsent,
  isGranted,
  subscribeConsent,
  type ConsentState,
  type ConsentStatus,
} from '../privacy/consent-manager';
