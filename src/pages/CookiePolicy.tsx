import { Link } from 'react-router-dom';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import { openConsentPreferences } from '../platform/consent';

export default function CookiePolicy() {
  return (
    <>
      <Breadcrumbs />
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Cookie &amp; Storage Policy
        </h1>
        <p className="mt-2 text-xs text-slate-600">Last updated: November 2026</p>

        <div className="mt-8 space-y-4 text-sm leading-relaxed text-slate-700">
          <p>
            This policy explains how AHADEX Tools uses browser storage and optional cookies, and how
            you can review or change your privacy preferences at any time.
          </p>

          <div className="rounded-lg border border-[#e6e2d8] bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Manage Your Preferences</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-700">
              Essential consent storage stays active so your choices are remembered. Optional
              analytics and advertising start disabled until you choose to allow them.
            </p>
            <button
              type="button"
              onClick={() => openConsentPreferences()}
              className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Manage Privacy Preferences
            </button>
          </div>

          <h2 className="mt-8 font-display text-xl font-semibold text-slate-900">
            Cookies &amp; Local Storage Explained
          </h2>
          <p>
            Cookies are small text files stored by your browser for websites or embedded third-party
            services. Browser{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">localStorage</code> stores
            key-value preferences locally on your device without sending them in every HTTP request
            header.
          </p>

          <h2 className="mt-8 font-display text-xl font-semibold text-slate-900">
            Categories of Storage &amp; Cookies
          </h2>

          <h3 className="mt-4 font-display text-base font-semibold text-slate-900">
            1. Essential Browser Storage (Active)
          </h3>
          <p>
            AHADEX Tools stores a single local preference record in{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">localStorage</code> under{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">ahadex_consent_v1</code> to
            remember your privacy choices. We do not set authentication, session, or tracking
            cookies for file processing.
          </p>

          <h3 className="mt-4 font-display text-base font-semibold text-slate-900">
            2. Optional Analytics Cookies (Disabled by Default)
          </h3>
          <p>
            Microsoft Clarity and optional Google Analytics remain disabled until you grant
            analytics consent. When you opt in, Microsoft Clarity may set first-party analytical
            cookies (such as <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">_clck</code>{' '}
            and <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">_clsk</code>) to measure
            aggregate navigation and interface usability without reading file contents or filenames.
            When Google Analytics is also configured, it records aggregate tool interaction counts.
            You can revoke consent anytime via our preference panel, review the{' '}
            <a
              href="https://privacy.microsoft.com/privacystatement"
              className="text-slate-900 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Microsoft Privacy Statement
            </a>
            , or use the{' '}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              className="text-slate-900 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Analytics Opt-out
            </a>
            .
          </p>

          <h3 className="mt-4 font-display text-base font-semibold text-slate-900">
            3. Optional Advertising Cookies (Disabled by Default)
          </h3>
          <p>
            Google AdSense is only active once approved, configured with a verified publisher ID,
            and explicitly permitted by your advertising consent choice. When active, Google may use
            cookies to serve and measure ads. You can control ad personalization via{' '}
            <a
              href="https://adssettings.google.com/"
              className="text-slate-900 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Ad Settings
            </a>{' '}
            or{' '}
            <a
              href="https://www.aboutads.info/"
              className="text-slate-900 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              aboutads.info
            </a>
            .
          </p>

          <h2 className="mt-8 font-display text-xl font-semibold text-slate-900">
            Managing Cookies &amp; Storage in Your Browser
          </h2>
          <p>You can inspect, block, or clear cookies and site storage in your browser settings:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Chrome:</strong> Settings → Privacy and security → Third-party cookies / Site
              data
            </li>
            <li>
              <strong>Firefox:</strong> Settings → Privacy &amp; Security → Cookies and Site Data
            </li>
            <li>
              <strong>Safari:</strong> Settings → Privacy → Manage Website Data
            </li>
            <li>
              <strong>Edge:</strong> Settings → Cookies and site permissions
            </li>
          </ul>
          <p className="mt-2">
            Blocking optional storage or third-party cookies does not restrict core functionality;
            every image and PDF tool continues to work locally in your browser.
          </p>

          <h2 className="mt-8 font-display text-xl font-semibold text-slate-900">Contact</h2>
          <p>
            Questions about storage or cookies? Email{' '}
            <a
              href="mailto:privacy@ahadex.online"
              className="text-slate-900 underline hover:text-slate-700"
            >
              privacy@ahadex.online
            </a>{' '}
            or read our{' '}
            <Link
              to="/privacy-policy/"
              className="font-medium text-brand-700 underline hover:text-brand-800"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
