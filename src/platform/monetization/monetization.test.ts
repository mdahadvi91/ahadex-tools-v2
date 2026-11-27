import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAdSlotEligibility } from './index';
import { ensureAdSenseScriptLoaded } from './adsense-loader';

describe('Google AdSense consent and publisher gate', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    document.querySelectorAll('script[data-ahadex-adsense]').forEach((el) => el.remove());
  });

  it('keeps AdSense disabled by default when publisher ID is unset', () => {
    const eligibility = getAdSlotEligibility();
    expect(eligibility.enabled).toBe(false);
    expect(eligibility.reason).toBe('missing_publisher_id');
    expect(ensureAdSenseScriptLoaded()).toBe(false);
    expect(document.querySelector('script[data-ahadex-adsense]')).toBeNull();
  });
});
