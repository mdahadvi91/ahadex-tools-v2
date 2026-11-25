import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openConsentPreferences, readConsentState } from '../../platform/consent';
import CookieConsentBanner from './CookieConsentBanner';

let container: HTMLDivElement | null = null;
let root: Root | null = null;

async function tick(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function mountBanner(): Promise<HTMLDivElement> {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  flushSync(() => {
    root!.render(
      <MemoryRouter>
        <CookieConsentBanner />
      </MemoryRouter>,
    );
  });
  await tick();
  return container;
}

function findButtonByText(rootEl: HTMLElement, text: string): HTMLButtonElement {
  const buttons = Array.from(rootEl.querySelectorAll('button'));
  const match = buttons.find((btn) => btn.textContent?.trim() === text);
  if (!match) {
    throw new Error(`Button with text "${text}" not found.`);
  }
  return match;
}

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    if (root) {
      flushSync(() => {
        root!.unmount();
      });
      root = null;
    }
    if (container) {
      container.remove();
      container = null;
    }
  });

  it('renders nothing during SSR so client hydration matches initial markup cleanly', () => {
    const ssrHtml = renderToString(
      <MemoryRouter>
        <CookieConsentBanner />
      </MemoryRouter>,
    );
    expect(ssrHtml).toBe('');
  });

  it('opens granular preferences on Customize without saving prematurely, then saves exact selections', async () => {
    const host = await mountBanner();
    expect(host.textContent).toContain('Your Privacy Preferences');
    expect(readConsentState().updatedAt).toBeNull();

    // Clicking Customize reveals toggles without writing consent
    flushSync(() => {
      findButtonByText(host, 'Customize').click();
    });

    expect(readConsentState().updatedAt).toBeNull();
    const panel = host.querySelector('#consent-preferences-panel');
    expect(panel).not.toBeNull();

    const essentialCheckbox = host.querySelector('#consent-essential') as HTMLInputElement;
    const analyticsCheckbox = host.querySelector('#consent-analytics') as HTMLInputElement;
    const adsCheckbox = host.querySelector('#consent-ads') as HTMLInputElement;

    expect(essentialCheckbox.checked).toBe(true);
    expect(essentialCheckbox.disabled).toBe(true);
    expect(analyticsCheckbox.checked).toBe(false);
    expect(adsCheckbox.checked).toBe(false);

    // Enable analytics only, keep ads disabled
    flushSync(() => {
      analyticsCheckbox.click();
    });
    expect(analyticsCheckbox.checked).toBe(true);
    expect(adsCheckbox.checked).toBe(false);

    flushSync(() => {
      findButtonByText(host, 'Save Preferences').click();
    });

    const saved = readConsentState();
    expect(saved.analytics).toBe(true);
    expect(saved.ads).toBe(false);
    expect(saved.updatedAt).not.toBeNull();
    expect(host.querySelector('[role="region"]')).toBeNull();
  });

  it('supports Accept All, Reject All, and reopening preferences via openConsentPreferences()', async () => {
    const host = await mountBanner();

    flushSync(() => {
      findButtonByText(host, 'Accept All').click();
    });
    expect(readConsentState().analytics).toBe(true);
    expect(readConsentState().ads).toBe(true);
    expect(host.querySelector('[role="region"]')).toBeNull();

    // Reopen preferences from anywhere (e.g., footer or cookie policy)
    flushSync(() => {
      openConsentPreferences();
    });
    await tick();

    expect(host.querySelector('#consent-preferences-panel')).not.toBeNull();
    expect((host.querySelector('#consent-analytics') as HTMLInputElement).checked).toBe(true);
    expect((host.querySelector('#consent-ads') as HTMLInputElement).checked).toBe(true);

    // Cancel closes without changing saved values
    flushSync(() => {
      findButtonByText(host, 'Cancel').click();
    });
    expect(readConsentState().ads).toBe(true);
    expect(host.querySelector('[role="region"]')).toBeNull();

    // Reopen and Reject All
    flushSync(() => {
      openConsentPreferences();
    });
    await tick();
    flushSync(() => {
      findButtonByText(host, 'Reject All').click();
    });
    expect(readConsentState().analytics).toBe(false);
    expect(readConsentState().ads).toBe(false);
  });
});
