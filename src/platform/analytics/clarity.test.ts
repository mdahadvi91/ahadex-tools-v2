import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getEnvironment } from '../../config/environment';
import { resetConsentState, writeConsentState } from '../consent';
import { canTrackAnalytics, trackEvent } from './index';
import {
  CLARITY_SCRIPT_ATTR,
  ensureClarityScriptLoaded,
  isClarityEligible,
  revokeClarityConsent,
} from './clarity-loader';

describe('Microsoft Clarity consent-gated integration', () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetConsentState();
    document.querySelectorAll(`script[${CLARITY_SCRIPT_ATTR}]`).forEach((el) => el.remove());
    delete window.clarity;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    document.querySelectorAll(`script[${CLARITY_SCRIPT_ATTR}]`).forEach((el) => el.remove());
    delete window.clarity;
  });

  it('uses zkc26mkuvb by default and stays disabled until analytics consent is granted', () => {
    const env = getEnvironment();
    expect(env.clarityProjectId).toBe('zkc26mkuvb');
    expect(isClarityEligible()).toEqual({ enabled: false, projectId: 'zkc26mkuvb' });
    expect(canTrackAnalytics()).toBe(false);
    expect(ensureClarityScriptLoaded()).toBe(false);
    expect(document.querySelector(`script[${CLARITY_SCRIPT_ATTR}]`)).toBeNull();
  });

  it('injects the exact Clarity tag once analytics consent is granted and avoids duplicate tags', () => {
    writeConsentState({ analytics: true, ads: false });

    expect(isClarityEligible()).toEqual({ enabled: true, projectId: 'zkc26mkuvb' });
    expect(canTrackAnalytics()).toBe(true);
    expect(ensureClarityScriptLoaded()).toBe(true);
    expect(ensureClarityScriptLoaded()).toBe(true);

    const scripts = document.querySelectorAll(`script[${CLARITY_SCRIPT_ATTR}]`);
    expect(scripts.length).toBe(1);
    const script = scripts[0] as HTMLScriptElement;
    expect(script.async).toBe(true);
    expect(script.getAttribute(CLARITY_SCRIPT_ATTR)).toBe('zkc26mkuvb');
    expect(script.src).toBe('https://www.clarity.ms/tag/zkc26mkuvb?ref=bwt');
    expect(typeof window.clarity).toBe('function');
  });

  it('forwards trackEvent only when analytics consent is active and supports consent revocation', () => {
    const claritySpy = vi.fn();
    window.clarity = claritySpy;

    // Blocked without consent
    trackEvent('tool_opened', { slug: 'cv-maker' });
    expect(claritySpy).not.toHaveBeenCalled();

    // Allowed with consent
    writeConsentState({ analytics: true, ads: false });
    trackEvent('tool_opened', { slug: 'cv-maker' });
    expect(claritySpy).toHaveBeenCalledWith('event', 'tool_opened');

    // Revocation signals Clarity consent false
    revokeClarityConsent();
    expect(claritySpy).toHaveBeenCalledWith('consent', false);
  });
});
