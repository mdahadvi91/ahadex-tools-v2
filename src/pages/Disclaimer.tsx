export default function Disclaimer() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Disclaimer
      </h1>
      <p className="mt-2 text-xs text-slate-500">Last updated: November 2026</p>

      <div className="mt-8 space-y-4 text-sm leading-relaxed text-slate-700">
        <h2 className="mt-8 text-xl font-semibold text-slate-900">General Information</h2>
        <p>
          The information and tools provided by AHADEX Tools are for general informational and
          practical purposes only. While we strive to provide accurate and useful tools, we make no
          warranties of any kind, express or implied, about the completeness, accuracy, or
          reliability of the tools or their results.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">File Processing</h2>
        <p>
          All files are processed locally in your browser. We do not access, review, or store your
          files. However, we are not responsible for any corruption, loss, or damage to your files
          resulting from the use of our tools. <strong>Always keep backups of your original files
          before processing.</strong>
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">No Professional Advice</h2>
        <p>
          Nothing on this site constitutes professional advice (legal, financial, medical, or
          otherwise). The tools are provided as-is for general use.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">External Links</h2>
        <p>
          Our site may contain links to external websites. We are not responsible for the content
          or privacy practices of those sites.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">Advertising</h2>
        <p>
          AHADEX Tools is supported by advertising (Google AdSense). Advertisements are selected by
          Google and are not endorsed by us. We have no control over which ads appear.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">No Guarantee of Availability</h2>
        <p>
          We do not guarantee that the site will be available at all times. The site may be
          unavailable due to maintenance, technical issues, or other reasons.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">Contact</h2>
        <p>
          Questions about this disclaimer? Contact{' '}
          <a href="mailto:contact@ahadex.online" className="text-slate-900 underline hover:text-slate-700">
            contact@ahadex.online
          </a>
        </p>
      </div>
    </div>
  );
}
