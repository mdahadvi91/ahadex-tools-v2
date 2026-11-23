import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-slate-50 to-white px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-medium text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
          100% Browser-Based — Your Files Never Leave Your Device
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
          Free Online File Tools
          <span className="block text-slate-500 mt-2 text-3xl sm:text-4xl md:text-5xl">
            No Upload, No Signup, No Limits
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base text-slate-600 sm:text-lg">
          Compress images, resize photos, merge PDFs, and split documents — all processed locally in
          your browser. Complete privacy, zero uploads, unlimited usage.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="#tools"
            className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 transition-colors"
          >
            Browse All Tools →
          </Link>
          <Link
            to="/about"
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Learn More
          </Link>
        </div>

        <dl className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-6 text-center">
          <div>
            <dt className="text-xs uppercase tracking-wider text-slate-500">Files Processed</dt>
            <dd className="mt-1 text-2xl font-bold text-slate-900">100% Local</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-slate-500">Uploads</dt>
            <dd className="mt-1 text-2xl font-bold text-slate-900">Zero</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-slate-500">Signup Required</dt>
            <dd className="mt-1 text-2xl font-bold text-slate-900">Never</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
