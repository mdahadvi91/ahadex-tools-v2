interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

const FAQS: readonly FaqItem[] = [
  {
    question: 'Are my files uploaded to a server?',
    answer:
      'No. All tools on AHADEX run entirely in your browser using JavaScript and Web Workers. Your files never leave your device and are never uploaded to any server.',
  },
  {
    question: 'Is AHADEX Tools free to use?',
    answer:
      'Yes, all published tools are completely free with no signup required, no watermarks, and no account gates.',
  },
  {
    question: 'Do you store or log my processed files?',
    answer:
      'No. Because files are processed locally in browser memory, our servers never receive or store your files.',
  },
  {
    question: 'What file formats are supported?',
    answer:
      'Our image utilities support JPEG, PNG, WebP, GIF, and AVIF files depending on browser codec support, and our PDF suite handles standard PDF documents for compression, merging, and splitting. Each tool page lists its exact limits and outputs.',
  },
  {
    question: 'Can I use these tools on mobile devices?',
    answer:
      'Yes. AHADEX Tools works on modern desktop, tablet, and mobile browsers including Chrome, Safari, Firefox, and Edge.',
  },
  {
    question: 'Is there a file size limit?',
    answer:
      'Each tool enforces safe memory thresholds tailored to browser execution so tabs stay responsive, and overall capacity depends on your device RAM.',
  },
];

export default function FAQSection() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <section id="faq" className="scroll-mt-24 border-t border-slate-200 pt-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Frequently Asked Questions
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Common questions about privacy, browser processing, and file limits
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {FAQS.map((faq) => (
          <details
            key={faq.question}
            className="group rounded-xl border border-slate-200 bg-white px-5 py-4"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-slate-900 hover:text-brand-600">
              <span>{faq.question}</span>
              <span
                className="text-slate-400 transition-transform group-open:rotate-180"
                aria-hidden="true"
              >
                ▾
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
