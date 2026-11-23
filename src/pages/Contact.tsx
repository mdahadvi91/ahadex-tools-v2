export default function Contact() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Contact Us</h1>

      <div className="mt-8 space-y-4 text-sm leading-relaxed text-slate-700">
        <p>
          Have a question, suggestion, or issue with one of our tools? We'd love to hear from you.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">Email</h2>
        <p>
          For general inquiries, feedback, or bug reports:{' '}
          <a
            href="mailto:contact@ahadex.online"
            className="text-slate-900 underline hover:text-slate-700"
          >
            contact@ahadex.online
          </a>
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">Business Inquiries</h2>
        <p>
          For advertising, partnerships, or press:{' '}
          <a
            href="mailto:business@ahadex.online"
            className="text-slate-900 underline hover:text-slate-700"
          >
            business@ahadex.online
          </a>
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">Report a Bug</h2>
        <p>If a tool isn't working as expected, please include:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>The tool you were using</li>
          <li>Your browser and operating system</li>
          <li>The file type and approximate size</li>
          <li>A description of what went wrong</li>
        </ul>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">Response Time</h2>
        <p>
          We typically respond within 2-3 business days. For urgent issues, please include "URGENT"
          in the subject line.
        </p>
      </div>
    </div>
  );
}
