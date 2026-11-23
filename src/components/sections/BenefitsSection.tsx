interface Benefit {
  title: string;
  description: string;
  icon: 'lock' | 'bolt' | 'gift' | 'user';
}

const BENEFITS: Benefit[] = [
  {
    title: '100% Private',
    description:
      'All processing happens locally in your browser. Your files never touch our servers — no uploads, no storage, no tracking.',
    icon: 'lock',
  },
  {
    title: 'Lightning Fast',
    description:
      "No waiting for uploads or downloads. Files are processed instantly using your device's native capabilities.",
    icon: 'bolt',
  },
  {
    title: 'Completely Free',
    description:
      'Every tool is free forever. No hidden costs, no premium tiers, no watermarks added to your files.',
    icon: 'gift',
  },
  {
    title: 'No Signup Required',
    description:
      'Use any tool without creating an account. No email, no password, no personal information needed.',
    icon: 'user',
  },
];

const ICON_PATHS: Record<Benefit['icon'], string> = {
  lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  bolt: 'M13 10V3L4 14h7v7l9-11h-7z',
  gift: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
};

export default function BenefitsSection() {
  return (
    <section className="bg-white px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Why Choose AHADEX Tools?
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Privacy-first file processing, built for speed and simplicity
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((benefit) => (
            <div
              key={benefit.title}
              className="rounded-xl border border-slate-200 bg-white p-6 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 text-white">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={ICON_PATHS[benefit.icon]} />
                </svg>
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">{benefit.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
