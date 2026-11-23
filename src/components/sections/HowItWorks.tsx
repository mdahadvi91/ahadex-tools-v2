interface Step {
  readonly number: string;
  readonly title: string;
  readonly description: string;
}

const STEPS: readonly Step[] = [
  {
    number: '01',
    title: 'Choose Your Utility',
    description: 'Pick the tool matching your workflow, such as Image Compressor or Image Resizer.',
  },
  {
    number: '02',
    title: 'Select Files Locally',
    description:
      'Drag and drop or browse from your device. Files are read directly in browser memory.',
  },
  {
    number: '03',
    title: 'Adjust Settings & Process',
    description:
      'Configure quality, target dimensions, or output format and run processing locally with zero upload delay.',
  },
  {
    number: '04',
    title: 'Download Clean Output',
    description:
      'Inspect before-and-after metrics and save the resulting file straight to your device.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 border-t border-slate-200 pt-12">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          How It Works
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Four deterministic steps executed completely on your own device
        </p>
      </div>

      <ol className="mt-6 grid gap-4 sm:grid-cols-2">
        {STEPS.map((step) => (
          <li key={step.number} className="rounded-xl border border-slate-200 bg-white p-5">
            <span className="font-mono text-xs font-semibold text-brand-600 tabular-nums">
              {step.number}.
            </span>
            <h3 className="mt-2 font-display text-base font-semibold text-slate-900">
              {step.title}
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
