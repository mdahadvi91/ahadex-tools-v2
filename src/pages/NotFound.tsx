import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
      <p className="text-6xl font-bold text-slate-900">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">Page Not Found</h1>
      <p className="mt-3 max-w-md text-sm text-slate-600">
        The page you're looking for doesn't exist or has been moved. Let's get you back to the
        tools.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
        >
          Back to Home
        </Link>
        <Link
          to="/#tools"
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Browse Tools
        </Link>
      </div>
    </div>
  );
}
