/**
 * Long-form educational and reference content for the Split PDF page.
 */

import {
  HOW_IT_WORKS,
  LIMITATIONS,
  PRIVACY,
  REFERENCES,
  SECTIONS,
  SUPPORTED_INPUT_FORMATS,
  USE_CASES,
} from './content';
import FAQ from './FAQ';

export default function Content() {
  return (
    <article className="mt-14 space-y-12">
      {SECTIONS.map((section) => (
        <section key={section.heading}>
          <h2 className="font-display text-2xl font-bold text-slate-900">{section.heading}</h2>
          {section.paragraphs.map((paragraph, index) => (
            <p key={index} className="mt-3 leading-relaxed text-slate-700">
              {paragraph}
            </p>
          ))}
          {section.list && (
            <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">
              {section.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <section>
        <h2 className="font-display text-2xl font-bold text-slate-900">How to split a PDF</h2>
        <ol className="mt-6 space-y-4">
          {HOW_IT_WORKS.map((step) => (
            <li key={step.step} className="flex gap-4">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white tabular-nums">
                {step.step}
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-1 text-slate-700">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="font-display text-2xl font-bold text-slate-900">Common use cases</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {USE_CASES.map((useCase) => (
            <li
              key={useCase.title}
              className="rounded-xl border border-[#e6e2d8] bg-white p-5 shadow-xs"
            >
              <h3 className="font-semibold text-slate-900">{useCase.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">{useCase.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl font-bold text-slate-900">
          Supported document format
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-[#e6e2d8] bg-white p-4">
          <table className="min-w-full divide-y divide-[#e6e2d8] text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="py-2 pr-4 font-semibold">Format</th>
                <th className="py-2 pr-4 font-semibold">MIME</th>
                <th className="py-2 pr-4 font-semibold">Quality</th>
                <th className="py-2 font-semibold">Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4f1ea] text-slate-700">
              {SUPPORTED_INPUT_FORMATS.map((fmt) => (
                <tr key={fmt.name}>
                  <td className="py-2.5 pr-4 font-medium text-slate-900">{fmt.name}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs">{fmt.mime}</td>
                  <td className="py-2.5 pr-4">Lossless</td>
                  <td className="py-2.5">{fmt.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-bold text-slate-900">{PRIVACY.heading}</h2>
        {PRIVACY.paragraphs.map((paragraph, index) => (
          <p key={index} className="mt-3 leading-relaxed text-slate-700">
            {paragraph}
          </p>
        ))}
      </section>

      <section>
        <h2 className="font-display text-2xl font-bold text-slate-900">{LIMITATIONS.heading}</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">
          {LIMITATIONS.list.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <FAQ />

      <section>
        <h2 className="font-display text-2xl font-bold text-slate-900">References</h2>
        <ul className="mt-4 space-y-3">
          {REFERENCES.map((ref) => (
            <li key={ref.url}>
              <a
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-600 hover:underline"
              >
                {ref.label}
              </a>
              <span className="ml-2 text-sm text-slate-600">{ref.note}</span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
