/**
 * Consent-gated Microsoft Clarity script loader & consent signaling helper.
 *
 * Mirrors Microsoft's official Bing Webmaster Tools Clarity snippet:
 *   https://www.clarity.ms/tag/<projectId>?ref=bwt
 * while guaranteeing zero network calls unless the visitor has granted
 * analytics consent.
 */

import { getEnvironment } from '../../config/environment';
import { hasAnalyticsConsent } from '../consent';

export type ClarityQueueFn = ((...args: unknown[]) => void) & {
  q?: unknown[][];
};

declare global {
  interface Window {
    clarity?: ClarityQueueFn;
  }
}

export const CLARITY_SCRIPT_ATTR = 'data-ahadex-clarity';

function ensureClarityQueue(): ClarityQueueFn | null {
  if (typeof window === 'undefined') return null;
  if (typeof window.clarity !== 'function') {
    const stub: ClarityQueueFn = (...args: unknown[]) => {
      stub.q = stub.q || [];
      stub.q.push(args);
    };
    window.clarity = stub;
  }
  return window.clarity;
}

export function isClarityEligible(): {
  readonly enabled: boolean;
  readonly projectId: string | null;
} {
  const env = getEnvironment();
  if (!env.clarityProjectId) {
    return { enabled: false, projectId: null };
  }
  return {
    enabled: hasAnalyticsConsent(),
    projectId: env.clarityProjectId,
  };
}

export function ensureClarityScriptLoaded(): boolean {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return false;
  }

  const { enabled, projectId } = isClarityEligible();
  if (!enabled || !projectId) {
    return false;
  }

  const clarity = ensureClarityQueue();
  clarity?.('consent', true);

  const existing = document.querySelector(`script[${CLARITY_SCRIPT_ATTR}]`);
  if (existing) {
    return true;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${encodeURIComponent(projectId)}?ref=bwt`;
  script.setAttribute(CLARITY_SCRIPT_ATTR, projectId);
  document.head.appendChild(script);
  return true;
}

export function revokeClarityConsent(): void {
  if (typeof window === 'undefined') return;
  if (typeof window.clarity === 'function') {
    window.clarity('consent', false);
  }
}
