/**
 * Hero section for the Image Compressor page.
 * Content comes from content.ts; all claims are verifiable from code.
 */

import ToolVectorIcon from '../../components/tools/ToolVectorIcon';
import { DIRECT_ANSWER, HERO } from './content';

export default function Hero() {
  return (
    <section className="border-b border-[#e6e2d8] bg-gradient-to-b from-[#f4f1ea] via-[#f8f6f0] to-[#faf8f5] py-9 sm:py-12">
      <div className="ahadex-enter mx-auto max-w-4xl px-4 text-center sm:px-6">
        <div className="flex justify-center">
          <ToolVectorIcon kind="compress" size="lg" />
        </div>
        <p className="mt-4 text-xs font-semibold tracking-wide text-brand-700">
          Browser-Based Utility <span aria-hidden="true">·</span> Canvas &amp; Web Worker{' '}
          <span aria-hidden="true">·</span> Local Processing
        </p>
        <h1 className="mt-2.5 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          {HERO.h1}
        </h1>
        <p className="mt-3.5 text-base text-slate-700 sm:text-lg">{HERO.tagline}</p>
        <p className="mx-auto mt-2.5 max-w-2xl text-sm leading-relaxed text-slate-600">
          {DIRECT_ANSWER}
        </p>
        <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-600">
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
