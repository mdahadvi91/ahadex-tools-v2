export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Terms of Service
      </h1>
      <p className="mt-2 text-xs text-slate-500">Last updated: November 2026</p>

      <div className="mt-8 space-y-4 text-sm leading-relaxed text-slate-700">
        <p>
          By using AHADEX Tools, you agree to these terms. If you do not agree, please discontinue
          use of the site.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">1. Use of Service</h2>
        <p>
          AHADEX Tools provides free, browser-based file processing tools. You may use them for
          personal or commercial purposes, subject to these terms.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">2. Acceptable Use</h2>
        <p>You agree NOT to use AHADEX Tools to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Process files you do not have legal rights to</li>
          <li>Process illegal content, including CSAM, malware, or pirated material</li>
          <li>Attempt to reverse-engineer or exploit the service</li>
          <li>Interfere with other users' access</li>
        </ul>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">3. No Warranty</h2>
        <p>
          The tools are provided "as is" without any warranty, express or implied. We do not
          guarantee that the tools will be error-free, meet your requirements, or produce specific
          results.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">4. Limitation of Liability</h2>
        <p>
          AHADEX Tools is not responsible for any damage or loss resulting from use of the tools,
          including but not limited to: loss of data, file corruption, or business interruption.
          Always keep backups of your original files.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">5. Intellectual Property</h2>
        <p>
          The AHADEX Tools website, design, and code are protected by copyright. You may not copy,
          modify, or redistribute any part of the site without permission.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">6. Changes to Service</h2>
        <p>
          We reserve the right to modify, suspend, or discontinue any tool at any time without
          notice.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">7. Changes to Terms</h2>
        <p>
          We may update these terms from time to time. Continued use of the site after changes
          constitutes acceptance of the new terms.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">8. Governing Law</h2>
        <p>
          These terms are governed by the laws of the United Arab Emirates, without regard to
          conflict of law principles.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">9. Contact</h2>
        <p>
          For legal matters, contact{' '}
          <a href="mailto:legal@ahadex.online" className="text-slate-900 underline hover:text-slate-700">
            legal@ahadex.online
          </a>
        </p>
      </div>
    </div>
  );
}
