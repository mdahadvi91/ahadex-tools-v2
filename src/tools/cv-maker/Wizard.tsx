/**
 * Interactive 4-phase overview header and interactive CV Maker workspace wrapper.
 */

import Tool from './Tool';

const WIZARD_STEPS = [
  { number: '01', title: 'Select Template', detail: 'Compare 30 distinct CV designs' },
  { number: '02', title: 'Pick Profession', detail: 'Auto-fill role summary & history' },
  { number: '03', title: 'Edit Sections', detail: 'Update photo, jobs, schools & skills' },
  { number: '04', title: 'Export PDF', detail: 'Download clean A4 PDF locally' },
] as const;

export default function Wizard() {
  return (
    <section aria-label="CV Maker workspace" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {WIZARD_STEPS.map((step) => (
            <li
              key={step.number}
              className="rounded-lg border border-[#e6e2d8] bg-[#faf8f5] px-4 py-3"
            >
              <span className="font-mono text-xs font-semibold text-brand-700 tabular-nums">
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
