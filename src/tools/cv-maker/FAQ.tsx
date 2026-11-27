/**
 * FAQ disclosure section for CV Maker.
 */

import { FAQ as FAQ_ITEMS } from './content';

export default function FAQ() {
  return (
    <section aria-labelledby="cv-maker-faq" className="mt-16">
      <h2 id="cv-maker-faq" className="font-display text-2xl font-bold text-slate-900">
        Frequently asked questions
      </h2>
      <div className="mt-6 divide-y divide-[#e6e2d8] border-y border-[#e6e2d8]">
        {FAQ_ITEMS.map((item) => (
          <details key={item.question} className="group py-4">
            <summary className="flex cursor-pointer items-center justify-between font-semibold text-slate-900">
              <span>{item.question}</span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
                className="transition-transform group-open:rotate-180"
              >
                <path
                  d="M5 8l5 5 5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </summary>
            <p className="mt-3 text-slate-700">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
