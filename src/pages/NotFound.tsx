import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
      <p className="font-display text-6xl font-bold text-slate-900 tabular-nums">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-slate-900 sm:text-3xl">
        Page Not Found
      </h1>
      <p className="mt-3 max-w-md text-sm text-slate-600">
        The page you&apos;re looking for doesn&apos;t exist or has been moved. Return home to access
        all browser tools.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Back to Home
        </Link>
        <a
          href="/#tools"
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Browse Tools
        </a>
      </div>
    </div>
  );
}
