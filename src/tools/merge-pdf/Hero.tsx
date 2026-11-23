/**
 * Hero section for the Merge PDF page.
 */

import { DIRECT_ANSWER, HERO } from './content';

export default function Hero() {
  return (
    <section className="border-b border-slate-200 bg-slate-50 py-10 sm:py-14">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <p className="text-xs font-semibold tracking-wide text-brand-700">
          Browser-Based Utility <span aria-hidden="true">·</span> Sequential PDF Combiner{' '}
          <span aria-hidden="true">·</span> Local Processing
        </p>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          {HERO.h1}
        </h1>
        <p className="mt-4 text-base text-slate-700 sm:text-lg">{HERO.tagline}</p>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
          {DIRECT_ANSWER}
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-600">
          {HERO.trustSignals.map((signal) => (
            <li key={signal} className="inline-flex items-center gap-1.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="#15803d"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {signal}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
