/**
 * Long-form educational and reference content for the Split PDF page.
 */

import { Link } from 'react-router-dom';
import {
  HOW_IT_WORKS,
  INTERNAL_LINKS,
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
    <article className="mt-16 space-y-12">
      {SECTIONS.map((section) => (
        <section key={section.heading}>
          <h2 className="text-2xl font-bold text-slate-900">{section.heading}</h2>
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
        <h2 className="text-2xl font-bold text-slate-900">How to split a PDF</h2>
        <ol className="mt-6 space-y-4">
          {HOW_IT_WORKS.map((step) => (
            <li key={step.step} className="flex gap-4">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
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
        <h2 className="text-2xl font-bold text-slate-900">Common use cases</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {USE_CASES.map((useCase) => (
            <li key={useCase.title} className="rounded-lg border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900">{useCase.title}</h3>
              <p className="mt-1 text-sm text-slate-700">{useCase.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">Supported document format</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="py-2 pr-4 font-semibold">Format</th>
                <th className="py-2 pr-4 font-semibold">MIME</th>
                <th className="py-2 pr-4 font-semibold">Quality</th>
                <th className="py-2 font-semibold">Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {SUPPORTED_INPUT_FORMATS.map((fmt) => (
                <tr key={fmt.name}>
                  <td className="py-2 pr-4 font-medium">{fmt.name}</td>
                  <td className="py-2 pr-4">{fmt.mime}</td>
                  <td className="py-2 pr-4">Lossless</td>
                  <td className="py-2">{fmt.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">{PRIVACY.heading}</h2>
        {PRIVACY.paragraphs.map((paragraph, index) => (
          <p key={index} className="mt-3 leading-relaxed text-slate-700">
            {paragraph}
          </p>
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">{LIMITATIONS.heading}</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">
          {LIMITATIONS.list.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <FAQ />

      <section>
        <h2 className="text-2xl font-bold text-slate-900">References</h2>
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

      <section>
        <h2 className="text-2xl font-bold text-slate-900">Related resources</h2>
        <ul className="mt-4 flex flex-wrap gap-3">
          {INTERNAL_LINKS.map((link) => (
            <li key={link.path}>
              <Link
                to={link.path}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
