export default function CookiePolicy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Cookie Policy
      </h1>
      <p className="mt-2 text-xs text-slate-500">Last updated: November 2026</p>

      <div className="mt-8 space-y-4 text-sm leading-relaxed text-slate-700">
        <p>
          This policy explains how AHADEX Tools uses cookies and similar technologies.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">What Are Cookies?</h2>
        <p>
          Cookies are small text files stored on your device by your browser. They help websites
          remember your preferences and understand how you use the site.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">Cookies We Use</h2>

        <h3 className="mt-4 text-base font-semibold text-slate-900">Essential Cookies</h3>
        <p>
          Necessary for the site to function. Cannot be disabled. We use these for basic
          functionality like remembering your cookie consent choice.
        </p>

        <h3 className="mt-4 text-base font-semibold text-slate-900">Analytics Cookies</h3>
        <p>
          Help us understand how visitors use the site (Google Analytics). These are anonymized and
          do not identify you personally. You can opt out via your browser settings or the{' '}
          <a href="https://tools.google.com/dlpage/gaoptout" className="text-slate-900 underline" target="_blank" rel="noopener noreferrer">
            Google Analytics Opt-out
          </a>.
        </p>

        <h3 className="mt-4 text-base font-semibold text-slate-900">Advertising Cookies</h3>
        <p>
          Used by Google AdSense to show relevant ads. These may track your browsing across sites.{' '}
          <a href="https://adssettings.google.com/" className="text-slate-900 underline" target="_blank" rel="noopener noreferrer">
            Manage Google ad settings
          </a>{' '}
          or opt out via{' '}
          <a href="https://www.aboutads.info/" className="text-slate-900 underline" target="_blank" rel="noopener noreferrer">
            aboutads.info
          </a>.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">Managing Cookies</h2>
        <p>You can manage cookies through your browser settings:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies</li>
          <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies</li>
          <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
          <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
        </ul>
        <p className="mt-2">
          Disabling cookies may affect some features of the site, but the core tools will continue
          to work.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">Contact</h2>
        <p>
          Questions about cookies? Email{' '}
          <a href="mailto:privacy@ahadex.online" className="text-slate-900 underline hover:text-slate-700">
            privacy@ahadex.online
          </a>
        </p>
      </div>
    </div>
  );
}
