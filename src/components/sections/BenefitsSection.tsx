interface Benefit {
  readonly title: string;
  readonly description: string;
  readonly icon: 'lock' | 'bolt' | 'gift' | 'user';
}

const BENEFITS: readonly Benefit[] = [
  {
    title: 'Zero Server Uploads',
    description:
      'All processing executes in browser memory and Web Workers. Your files never leave your computer or phone.',
    icon: 'lock',
  },
  {
    title: 'Instant Local Speed',
    description:
      'Skip upload queues and server round-trips. Processing starts immediately using your device CPU.',
    icon: 'bolt',
  },
  {
    title: 'Free Without Watermarks',
    description: 'Export clean files without forced watermarks, paywalls, or arbitrary daily caps.',
    icon: 'gift',
  },
  {
    title: 'No Account Required',
    description:
      'Open any utility and process files immediately without email registration or login walls.',
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
    <section id="benefits" className="scroll-mt-24 border-t border-[#e6e2d8] pt-12">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Why Choose AHADEX Tools?
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Built around verifiable client-side privacy and practical daily performance
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {BENEFITS.map((benefit) => (
          <div
            key={benefit.title}
            className="ahadex-card flex items-start gap-4 rounded-xl border border-[#e6e2d8] bg-white p-5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={ICON_PATHS[benefit.icon]} />
              </svg>
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                {benefit.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{benefit.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
