/**
 * Long-form SEO content sections for the Image Compressor page.
 * Renders SECTIONS, HOW_IT_WORKS, USE_CASES, PRIVACY, LIMITATIONS,
 * and REFERENCES from content.ts.
 */

import {
  SECTIONS,
  HOW_IT_WORKS,
  USE_CASES,
  SUPPORTED_INPUT_FORMATS,
  PRIVACY,
  LIMITATIONS,
  REFERENCES,
  INTERNAL_LINKS,
} from './content';
import { Link } from 'react-router-dom';
import FAQ from './FAQ';

export default function Content() {
  return (
    <article className="mt-16 space-y-12">
      {SECTIONS.map((section) => (
        <section key={section.heading}>
          <h2 className="text-2xl font-bold text-gray-900">{section.heading}</h2>
          {section.paragraphs.map((paragraph, i) => (
            <p key={i} className="mt-3 leading-relaxed text-gray-700">
              {paragraph}
            </p>
          ))}
          {section.list && (
            <ul className="mt-4 list-disc space-y-2 pl-6 text-gray-700">
              {section.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <section>
        <h2 className="text-2xl font-bold text-gray-900">How to use the tool</h2>
        <ol className="mt-6 space-y-4">
          {HOW_IT_WORKS.map((step) => (
            <li key={step.step} className="flex gap-4">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {step.step}
              </span>
              <div>
                <h3 className="font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-1 text-gray-700">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900">Common use cases</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {USE_CASES.map((useCase) => (
            <li key={useCase.title} className="rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900">{useCase.title}</h3>
              <p className="mt-1 text-sm text-gray-700">{useCase.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900">Supported formats</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 pr-4 font-semibold">Format</th>
                <th className="py-2 pr-4 font-semibold">MIME</th>
                <th className="py-2 pr-4 font-semibold">Compression</th>
                <th className="py-2 pr-4 font-semibold">Transparency</th>
                <th className="py-2 font-semibold">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {SUPPORTED_INPUT_FORMATS.map((f) => (
                <tr key={f.name}>
                  <td className="py-2 pr-4 font-medium">{f.name}</td>
                  <td className="py-2 pr-4">{f.mime}</td>
                  <td className="py-2 pr-4">{f.lossy ? 'Lossy' : 'Lossless'}</td>
                  <td className="py-2 pr-4">{f.transparency ? 'Yes' : 'No'}</td>
                  <td className="py-2">{f.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900">{PRIVACY.heading}</h2>
        {PRIVACY.paragraphs.map((p, i) => (
          <p key={i} className="mt-3 leading-relaxed text-gray-700">
            {p}
          </p>
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900">{LIMITATIONS.heading}</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-gray-700">
          {LIMITATIONS.list.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <FAQ />

      <section>
        <h2 className="text-2xl font-bold text-gray-900">References</h2>
        <ul className="mt-4 space-y-3">
          {REFERENCES.map((ref) => (
            <li key={ref.url}>
              <a
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline"
              >
                {ref.label}
              </a>
              <span className="ml-2 text-sm text-gray-600">{ref.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900">Related tools</h2>
        <ul className="mt-4 flex flex-wrap gap-3">
          {INTERNAL_LINKS.map((link) => (
            <li key={link.path}>
              <Link
                to={link.path}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
