/**
 * Interactive 3-step upload, configure, and download wizard wrapper
 * for the Image Compressor tool.
 */

import Tool from './Tool';

const WIZARD_STEPS = [
  { number: '01', title: 'Select Images', detail: 'Add JPG, PNG, WebP, GIF, or AVIF files' },
  { number: '02', title: 'Adjust Settings', detail: 'Pick output format, quality, or max size' },
  { number: '03', title: 'Compress & Save', detail: 'Download smaller files locally' },
] as const;

export default function Wizard() {
  return (
    <section aria-label="Image Compressor workspace" className="bg-white">
      <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
        <ol className="grid gap-3 sm:grid-cols-3">
          {WIZARD_STEPS.map((step) => (
            <li
              key={step.number}
              className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3"
            >
              <span className="font-mono text-xs font-semibold text-brand-600 tabular-nums">
                {step.number}.
              </span>{' '}
              <span className="text-xs font-semibold text-slate-900">{step.title}</span>
              <p className="mt-0.5 text-xs text-slate-600">{step.detail}</p>
            </li>
          ))}
        </ol>
      </div>
      <Tool />
    </section>
  );
}
