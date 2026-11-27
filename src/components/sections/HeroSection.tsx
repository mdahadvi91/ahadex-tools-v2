export default function HeroSection() {
  return (
    <section className="border-b border-[#e6e2d8] bg-gradient-to-b from-[#f4f1ea] via-[#f8f6f0] to-[#faf8f5] px-4 pt-8 pb-7 sm:px-6 sm:pt-12 sm:pb-9">
      <div className="ahadex-enter mx-auto max-w-4xl text-center">
        <h1 className="mx-auto max-w-3xl font-display text-[clamp(1.75rem,3.6vw,3rem)] font-extrabold leading-[1.12] tracking-tight text-slate-900 text-balance">
          Fast, Privacy-First Online File Tools
        </h1>

        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:mt-4 sm:text-base">
          Every tool you need to compress and resize images or merge, split, and optimize PDFs—100%
          free and processed locally in your browser with zero server uploads.
        </p>

        <p className="mt-3 text-xs font-medium text-slate-600">
          100% Client-Side <span aria-hidden="true">·</span> 0 Bytes Uploaded{' '}
          <span aria-hidden="true">·</span> No Signup Required
        </p>
      </div>
    </section>
  );
}
