export default function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-xs text-slate-500">Last updated: November 2026</p>

      <div className="mt-8 space-y-4 text-sm leading-relaxed text-slate-700">
        <p>
          AHADEX Tools ("we", "our", or "us") is committed to protecting your privacy. This policy
          explains what information we collect, how we use it, and your rights.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">1. Files You Process</h2>
        <p>
          <strong>
            We do not receive, store, or have access to any files you process using our tools.
          </strong>{' '}
          All file processing happens entirely in your browser. Your files never leave your device.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">2. Information We Collect</h2>
        <p>We collect minimal, non-identifying information:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Analytics data:</strong> Page views, browser type, country — used to understand
            site usage and improve tools
          </li>
          <li>
            <strong>Error logs:</strong> JavaScript errors — used to fix bugs
          </li>
          <li>
            <strong>Cookies:</strong> Small text files for analytics and advertising (see Section 4)
          </li>
        </ul>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">3. Third-Party Services</h2>
        <p>We use the following third-party services:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Google Analytics:</strong> Anonymous usage statistics (
            <a
              href="https://policies.google.com/privacy"
              className="text-slate-900 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Privacy Policy
            </a>
            )
          </li>
          <li>
            <strong>Google AdSense:</strong> Non-intrusive advertising that keeps our tools free (
            <a
              href="https://policies.google.com/technologies/ads"
              className="text-slate-900 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Ads Policy
            </a>
            )
          </li>
          <li>
            <strong>Cloudflare Pages:</strong> Static hosting and CDN (
            <a
              href="https://www.cloudflare.com/privacypolicy/"
              className="text-slate-900 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Cloudflare Privacy Policy
            </a>
            )
          </li>
        </ul>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">4. Cookies</h2>
        <p>
          We use cookies for analytics and advertising. You can disable cookies in your browser
          settings at any time. For more information, see our{' '}
          <a href="/cookie-policy" className="text-slate-900 underline hover:text-slate-700">
            Cookie Policy
          </a>
          .
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">5. Your Rights</h2>
        <p>Depending on your location, you may have the right to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Access information we have about you</li>
          <li>Request deletion of your data</li>
          <li>Opt out of analytics and advertising cookies</li>
          <li>Lodge a complaint with your data protection authority</li>
        </ul>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">6. Children's Privacy</h2>
        <p>
          Our tools are not directed at children under 13. We do not knowingly collect personal
          information from children.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">7. Changes to This Policy</h2>
        <p>
          We may update this policy from time to time. Changes will be posted on this page with an
          updated date.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">8. Contact</h2>
        <p>
          Questions about this policy? Email{' '}
          <a
            href="mailto:privacy@ahadex.online"
            className="text-slate-900 underline hover:text-slate-700"
          >
            privacy@ahadex.online
          </a>
        </p>
      </div>
    </div>
  );
}
