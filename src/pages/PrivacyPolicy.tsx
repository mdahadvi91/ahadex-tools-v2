import { Link } from 'react-router-dom';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import { openConsentPreferences } from '../platform/consent';

export default function PrivacyPolicy() {
  return (
    <>
      <Breadcrumbs />
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-xs text-slate-600">Last updated: November 2026</p>

        <div className="mt-8 space-y-4 text-sm leading-relaxed text-slate-700">
          <p>
            AHADEX Tools (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to
            protecting your privacy. This policy explains accurately how file processing, browser
            storage, and optional third-party services work on{' '}
            <span className="font-medium text-slate-900">ahadex.online</span>.
          </p>

          <h2 className="mt-8 font-display text-xl font-semibold text-slate-900">
            1. Files You Process
          </h2>
          <p>
            <strong>
              We do not receive, upload, store, or inspect any files you process using our tools.
            </strong>{' '}
            All image and PDF operations run locally in your browser memory via standard Web APIs
            and Web Workers. Your files remain strictly on your device.
          </p>

          <h2 className="mt-8 font-display text-xl font-semibold text-slate-900">
            2. Browser Storage &amp; Operational Data
          </h2>
          <p>We keep browser storage and network telemetry minimal and transparent:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Local consent storage:</strong> Essential browser{' '}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">localStorage</code> (key{' '}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">ahadex_consent_v1</code>)
              saves your analytics and advertising consent settings. Both optional categories
              default to off (
              <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">false</code>).
            </li>
            <li>
              <strong>No automated error tracking or file telemetry:</strong> AHADEX Tools does not
              transmit client JavaScript error logs, filenames, or file contents to any external
              telemetry server.
            </li>
            <li>
              <strong>Hosting &amp; CDN delivery:</strong> Static pages and assets are served via
              Cloudflare Pages, which processes standard HTTP request headers (such as IP address
              and user agent) transiently at the network edge for security, DDoS mitigation, and
              content delivery.
            </li>
          </ul>

          <h2 className="mt-8 font-display text-xl font-semibold text-slate-900">
            3. Optional Analytics &amp; Advertising Services
          </h2>
          <p>
            Optional analytics and advertising remain disabled by default and only activate if both
            configured for a deployment and explicitly permitted by your consent settings:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Microsoft Clarity (consent-gated):</strong> When you grant optional analytics
              consent, Microsoft Clarity collects aggregate usability metrics (such as page views,
              scroll depth, and interaction heatmaps) to help improve site navigation and tool
              ergonomics. Clarity does not inspect local file buffers or processed output bytes.
              Learn more in the{' '}
              <a
                href="https://privacy.microsoft.com/privacystatement"
                className="text-slate-900 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Microsoft Privacy Statement
              </a>
              .
            </li>
            <li>
              <strong>Google Analytics (optional, consent-gated):</strong> When enabled and
              consented to, records aggregate tool usage counts without filenames or file contents (
              <a
                href="https://policies.google.com/privacy"
                className="text-slate-900 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Privacy Policy
              </a>
              ).
            </li>
            <li>
              <strong>Google AdSense (optional, consent-gated):</strong> Reserved for non-intrusive
              advertising once approved, configured, and explicitly consented to. When active,
              third-party vendors, including Google, use cookies to serve ads based on a user&apos;s
              prior visits to this website or other websites. Google&apos;s use of advertising
              cookies enables it and its partners to serve ads based on visits across the internet.
              You can review{' '}
              <a
                href="https://policies.google.com/technologies/partner-sites"
                className="text-slate-900 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                how Google uses data on partner sites
              </a>{' '}
              or opt out of personalized advertising via{' '}
              <a
                href="https://adssettings.google.com/"
                className="text-slate-900 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Ad Settings
              </a>{' '}
              and{' '}
              <a
                href="https://www.aboutads.info/"
                className="text-slate-900 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                aboutads.info
              </a>{' '}
              (
              <a
                href="https://policies.google.com/technologies/ads"
                className="text-slate-900 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Ads Policy
              </a>
              ).
            </li>
            <li>
              <strong>Cloudflare Pages:</strong> Static hosting and CDN infrastructure (
              <a
                href="https://www.cloudflare.com/privacypolicy/"
                className="text-slate-900 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Cloudflare Privacy Policy
              </a>
              ).
            </li>
          </ul>

          <h2 className="mt-8 font-display text-xl font-semibold text-slate-900">
            4. Cookies &amp; Privacy Controls
          </h2>
          <p>
            Essential preference storage uses local browser storage rather than tracking cookies. If
            optional analytics or advertising is enabled and you opt in, Microsoft Clarity or Google
            services may set cookies subject to their own policies. You can review or update your
            choices anytime using the{' '}
            <button
              type="button"
              onClick={() => openConsentPreferences()}
              className="font-medium text-brand-700 underline hover:text-brand-800"
            >
              Privacy &amp; Cookie Settings
            </button>{' '}
            panel or read our{' '}
            <Link
              to="/cookie-policy/"
              className="font-medium text-brand-700 underline hover:text-brand-800"
            >
              Cookie Policy
            </Link>
            .
          </p>

          <h2 className="mt-8 font-display text-xl font-semibold text-slate-900">5. Your Rights</h2>
          <p>Depending on your jurisdiction, you have the right to:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Use every core tool without accepting optional analytics or advertising</li>
            <li>Withdraw or customize consent preferences at any time</li>
            <li>Clear local preference storage or browser cookies through your browser settings</li>
            <li>Lodge a complaint with your local data protection supervisory authority</li>
          </ul>

          <h2 className="mt-8 font-display text-xl font-semibold text-slate-900">
            6. Children&apos;s Privacy
          </h2>
          <p>
            Our tools are not directed at children under 13. We do not knowingly collect personal
            information from children.
          </p>

          <h2 className="mt-8 font-display text-xl font-semibold text-slate-900">
            7. Changes to This Policy
          </h2>
          <p>
            We may update this policy when site features or integrations change. Updates will be
            published on this page with a revised update date.
          </p>

          <h2 className="mt-8 font-display text-xl font-semibold text-slate-900">8. Contact</h2>
          <p>
            Questions about this policy? Email{' '}
            <a
              href="mailto:privacy@ahadex.online"
              className="text-slate-900 underline hover:text-slate-700"
            >
              privacy@ahadex.online
            </a>{' '}
            or visit our{' '}
            <Link
              to="/contact/"
              className="font-medium text-brand-700 underline hover:text-brand-800"
            >
              Contact page
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
