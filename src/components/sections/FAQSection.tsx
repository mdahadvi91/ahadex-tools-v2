interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'Are my files uploaded to a server?',
    answer:
      'No. All tools on AHADEX run entirely in your browser using JavaScript. Your files never leave your device and are never uploaded to any server.',
  },
  {
    question: 'Is AHADEX free to use?',
    answer:
      'Yes, all tools are completely free with no signup required. There are no usage limits, no premium tiers, and no watermarks added to your files.',
  },
  {
    question: 'Do you store my files?',
    answer:
      'No. Because files are processed locally in your browser, we never receive them. Nothing is stored, and nothing is shared with third parties.',
  },
  {
    question: 'What file formats are supported?',
    answer:
      'Image tools support JPEG, PNG, WebP, and GIF. PDF tools support standard PDF files. Each tool page lists its supported formats in detail.',
  },
  {
    question: 'Can I use these tools on mobile?',
    answer:
      'Yes. AHADEX Tools works on any modern browser — Chrome, Safari, Firefox, and Edge — on desktop, tablet, and mobile devices.',
  },
  {
    question: 'Is there a file size limit?',
    answer:
      'The only limit is your device\'s available memory. Files up to 100MB typically process fine on modern devices, though very large files may be slower.',
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
    <section className="bg-slate-50 px-4 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Common questions about privacy, usage, and file handling
          </p>
        </div>

        <div className="mt-10 space-y-3">
          {FAQS.map((faq, index) => (
            <details
              key={index}
              className="group rounded-lg border border-slate-200 bg-white px-4 py-3"
            >
              <summary className="cursor-pointer list-none text-sm font-medium text-slate-900 hover:text-slate-700 flex justify-between items-center">
                {faq.question}
                <span className="text-slate-400 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
