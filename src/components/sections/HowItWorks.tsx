interface Step {
  number: number;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    number: 1,
    title: 'Choose a Tool',
    description:
      'Pick the file tool you need — image compressor, PDF merger, or any of our free utilities.',
  },
  {
    number: 2,
    title: 'Select Your Files',
    description:
      'Drag and drop your files or click to browse. Everything stays on your device.',
  },
  {
    number: 3,
    title: 'Process Instantly',
    description:
      'Your file is processed locally in your browser. No uploads, no waiting, no server delays.',
  },
  {
    number: 4,
    title: 'Download Result',
    description:
      'Save the processed file to your device. Quality is preserved, privacy is guaranteed.',
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">How It Works</h2>
          <p className="mt-2 text-sm text-slate-600">
            Four simple steps — no signup, no uploads, no complications
          </p>
        </div>

        <ol className="mt-12 space-y-6">
          {STEPS.map((step) => (
            <li key={step.number} className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                {step.number}
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
