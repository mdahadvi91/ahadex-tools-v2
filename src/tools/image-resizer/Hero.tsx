/**
 * Hero section for the Image Resizer page.
 */

import { HERO, DIRECT_ANSWER } from './content';

export default function Hero() {
  return (
    <section className="border-b border-gray-200 bg-gradient-to-b from-blue-50 to-white py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Runs in your browser
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
          {HERO.h1}
        </h1>
        <p className="mt-4 text-lg text-gray-700 sm:text-xl">{HERO.tagline}</p>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">{DIRECT_ANSWER}</p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-600">
          {HERO.trustSignals.map((signal) => (
            <li key={signal} className="inline-flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="#16a34a"
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
