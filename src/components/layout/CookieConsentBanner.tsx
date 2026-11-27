import { useEffect, useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import {
  getServerConsentSnapshot,
  OPEN_CONSENT_EVENT,
  readConsentState,
  subscribeConsent,
  writeConsentState,
} from '../../platform/consent';

const subscribeNoop = () => () => {};

export default function CookieConsentBanner() {
  const isHydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const consent = useSyncExternalStore(
    subscribeConsent,
    readConsentState,
    getServerConsentSnapshot,
  );

  const [manualOpen, setManualOpen] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [draftAnalytics, setDraftAnalytics] = useState(false);
  const [draftAds, setDraftAds] = useState(false);

  useEffect(() => {
    const handleOpenPreferences = () => {
      const current = readConsentState();
      setDraftAnalytics(current.analytics);
      setDraftAds(current.ads);
      setIsCustomizing(true);
      setManualOpen(true);
    };

    window.addEventListener(OPEN_CONSENT_EVENT, handleOpenPreferences);
    return () => {
      window.removeEventListener(OPEN_CONSENT_EVENT, handleOpenPreferences);
    };
  }, []);

  const hasSavedChoice = consent.updatedAt !== null;
  const visible = isHydrated && (!hasSavedChoice || manualOpen);

  const saveAndClose = (next: { analytics: boolean; ads: boolean }) => {
    writeConsentState(next);
    setIsCustomizing(false);
    setManualOpen(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Privacy and cookie preferences"
      className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto border-t border-slate-300 bg-white px-4 py-4 shadow-xl sm:px-6"
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-slate-900">Your Privacy Preferences</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-700">
              All files are processed locally in your browser with zero uploads. We store your
              consent choice locally and keep optional analytics and advertising off unless enabled
              by you and configured on this site.{' '}
              <Link to="/cookie-policy/" className="font-medium text-slate-900 underline">
                Cookie Policy
              </Link>
              .
            </p>
          </div>

          {!isCustomizing && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => saveAndClose({ analytics: false, ads: false })}
                className="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100"
              >
                Reject All
              </button>
              <button
                type="button"
                aria-expanded={isCustomizing}
                aria-controls="consent-preferences-panel"
                onClick={() => {
                  setDraftAnalytics(consent.analytics);
                  setDraftAds(consent.ads);
                  setIsCustomizing(true);
                }}
                className="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100"
              >
                Customize
              </button>
              <button
                type="button"
                onClick={() => saveAndClose({ analytics: true, ads: true })}
                className="rounded-md bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Accept All
              </button>
            </div>
          )}
        </div>

        {isCustomizing && (
          <div
            id="consent-preferences-panel"
            className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-slate-200 bg-white p-3">
                <label
                  htmlFor="consent-essential"
                  className="flex cursor-not-allowed items-start gap-2.5"
                >
                  <input
                    id="consent-essential"
                    type="checkbox"
                    checked
                    disabled
                    readOnly
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-slate-900"
                  />
                  <span>
                    <span className="block text-xs font-semibold text-slate-900">
                      Essential Storage (Always Active)
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-700">
                      Saves your privacy choice in browser localStorage. Files remain local on your
                      device.
                    </span>
                  </span>
                </label>
              </div>

              <div className="rounded-md border border-slate-200 bg-white p-3">
                <label
                  htmlFor="consent-analytics"
                  className="flex cursor-pointer items-start gap-2.5"
                >
                  <input
                    id="consent-analytics"
                    type="checkbox"
                    checked={draftAnalytics}
                    onChange={(e) => setDraftAnalytics(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-slate-900"
                  />
                  <span>
                    <span className="block text-xs font-semibold text-slate-900">
                      Optional Analytics
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-700">
                      Aggregate usage and UX metrics via Microsoft Clarity or Google Analytics only
                      when configured and permitted—never filenames or file contents.
                    </span>
                  </span>
                </label>
              </div>

              <div className="rounded-md border border-slate-200 bg-white p-3">
                <label htmlFor="consent-ads" className="flex cursor-pointer items-start gap-2.5">
                  <input
                    id="consent-ads"
                    type="checkbox"
                    checked={draftAds}
                    onChange={(e) => setDraftAds(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-slate-900"
                  />
                  <span>
                    <span className="block text-xs font-semibold text-slate-900">
                      Optional Advertising
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-700">
                      Enables Google AdSense slots only once configured, approved, and consented to.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              {hasSavedChoice && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomizing(false);
                    setManualOpen(false);
                  }}
                  className="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={() => saveAndClose({ analytics: false, ads: false })}
                className="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100"
              >
                Reject All
              </button>
              <button
                type="button"
                onClick={() => saveAndClose({ analytics: draftAnalytics, ads: draftAds })}
                className="rounded-md border border-slate-900 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100"
              >
                Save Preferences
              </button>
              <button
                type="button"
                onClick={() => saveAndClose({ analytics: true, ads: true })}
                className="rounded-md bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Accept All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
