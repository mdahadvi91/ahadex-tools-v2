import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section className="border-b border-slate-200 bg-slate-50 px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-xs font-semibold tracking-wide text-brand-700">
          Browser-Based Utilities <span aria-hidden="true">·</span> Zero Server Uploads{' '}
          <span aria-hidden="true">·</span> Free Access
        </p>

        <h1 className="mx-auto mt-4 max-w-3xl font-display text-[clamp(2.25rem,4vw,3.5rem)] font-extrabold leading-[1.1] tracking-tight text-slate-900">
          Fast, Privacy-First Online File Tools
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
          Compress and resize images directly in your browser without uploading files to any remote
          server. Your documents and photos stay on your device from start to finish.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#tools"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Explore All Tools
          </a>
          <Link
            to="/about/"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            How Privacy Works
          </Link>
        </div>

        <dl className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-4 border-t border-slate-200 pt-8 sm:grid-cols-3">
          <div className="px-4 py-2">
            <dt className="text-xs font-medium text-slate-500">Execution Model</dt>
            <dd className="mt-1 font-display text-xl font-bold text-slate-900 tabular-nums">
              100% Client-Side
            </dd>
          </div>
          <div className="px-4 py-2">
            <dt className="text-xs font-medium text-slate-500">Server File Uploads</dt>
            <dd className="mt-1 font-display text-xl font-bold text-slate-900 tabular-nums">
              0 Bytes Uploaded
            </dd>
          </div>
          <div className="px-4 py-2">
            <dt className="text-xs font-medium text-slate-500">Account Requirement</dt>
            <dd className="mt-1 font-display text-xl font-bold text-slate-900">No Signup</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
