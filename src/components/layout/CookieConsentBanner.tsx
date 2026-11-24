import { useState } from 'react';
import { readConsentState, writeConsentState } from '../../platform/consent';

export default function CookieConsentBanner() {
  // Initial state-এ সরাসরি চেক করা হচ্ছে, যাতে useEffect-এর দরকার না হয়
  const [visible, setVisible] = useState(() => readConsentState().updatedAt === null);

  const handleAcceptAll = () => {
    writeConsentState({ analytics: true, ads: true });
    setVisible(false);
  };

  const handleRejectAll = () => {
    writeConsentState({ analytics: false, ads: false });
    setVisible(false);
  };

  const handleCustomize = () => {
    writeConsentState({ analytics: true, ads: false });
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white p-4 shadow-lg sm:p-6">
      <div className="mx-auto max-w-5xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">We value your privacy</p>
          <p className="mt-1 text-xs text-slate-600">
            We use cookies to improve your experience and show relevant ads. You can choose which cookies to allow.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRejectAll}
            className="rounded-md border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Reject All
          </button>
          <button
            type="button"
            onClick={handleCustomize}
            className="rounded-md border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Customize
          </button>
          <button
            type="button"
            onClick={handleAcceptAll}
            className="rounded-md bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
