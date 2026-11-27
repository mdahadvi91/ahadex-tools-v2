import { Link } from 'react-router-dom';
import Breadcrumbs from '../components/layout/Breadcrumbs';

export default function About() {
  return (
    <>
      <Breadcrumbs />
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          About AHADEX Tools
        </h1>

        <div className="mt-8 space-y-5 text-sm leading-relaxed text-slate-700">
          <p>
            AHADEX Tools is a collection of free, browser-based file utilities built with one
            principle in mind: <strong>your files should never leave your device</strong>.
          </p>

          <p>
            Most online tools work by uploading your file to a remote server, processing it there,
            and sending it back. This approach has real privacy implications — you have no way to
            verify what happens to your file on someone else&apos;s server. AHADEX takes a different
            approach: every tool runs entirely in your browser using modern JavaScript APIs. Your
            files are processed locally, on your own device, and never transmitted anywhere.
          </p>

          <h2 className="pt-4 font-display text-xl font-semibold text-slate-900">
            Why We Built This
          </h2>
          <p>
            We were frustrated with existing online tools that required signups, limited free usage,
            and uploaded files to unknown servers. We wanted to prove that useful tools could exist
            without compromising privacy or charging users.
          </p>

          <h2 className="pt-4 font-display text-xl font-semibold text-slate-900">How It Works</h2>
          <p>
            When you use an AHADEX tool, your browser performs all computation locally. Image
            compression and resizing run via the built-in Canvas API inside isolated Web Workers so
            your tab stays responsive. PDF compression, merging, and page splitting run using
            client-side PDF object parsing via{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">pdf-lib</code> directly in
            browser memory—zero servers touch your documents.
          </p>

          <h2 className="pt-4 font-display text-xl font-semibold text-slate-900">
            What We Don&apos;t Do
          </h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>We don&apos;t upload your files to any server</li>
            <li>We don&apos;t store your files or their metadata</li>
            <li>We don&apos;t require signup or personal information</li>
            <li>We don&apos;t add watermarks or limit free usage</li>
            <li>We don&apos;t sell or share any user data</li>
          </ul>

          <h2 className="pt-4 font-display text-xl font-semibold text-slate-900">
            Engineering &amp; Sustainability
          </h2>
          <p>
            Each tool on AHADEX Tools is built as an independent module with explicit file-size and
            memory safeguards, automated unit and browser end-to-end tests, and clear documentation
            covering formats and technical limits. Every utility remains free to use; optional,
            consent-gated advertising helps cover domain and build maintenance costs without locking
            features behind paywalls.
          </p>

          <h2 className="pt-4 font-display text-xl font-semibold text-slate-900">Contact</h2>
          <p>
            Questions, feedback, or issues? Reach out via our{' '}
            <Link
              to="/contact/"
              className="font-medium text-brand-600 underline hover:text-brand-700"
            >
              contact page
            </Link>{' '}
            or read our{' '}
            <Link
              to="/privacy-policy/"
              className="font-medium text-brand-600 underline hover:text-brand-700"
            >
              privacy policy
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
