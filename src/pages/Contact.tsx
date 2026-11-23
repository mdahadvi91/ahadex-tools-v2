import { useState, type FormEvent } from 'react';
import Breadcrumbs from '../components/layout/Breadcrumbs';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ContactErrors {
  name?: string;
  email?: string;
  message?: string;
}

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('Bug Report');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<ContactErrors>({});
  const [preparedMailto, setPreparedMailto] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextErrors: ContactErrors = {};

    if (name.trim().length < 2) {
      nextErrors.name = 'Please enter your name (at least 2 characters).';
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (message.trim().length < 15) {
      nextErrors.message = 'Please include at least 15 characters describing your inquiry.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setPreparedMailto(null);
      return;
    }

    const subject = encodeURIComponent(`[AHADEX Tools - ${topic}] From ${name.trim()}`);
    const body = encodeURIComponent(
      `Name: ${name.trim()}\nReply Email: ${email.trim()}\nTopic: ${topic}\n\n${message.trim()}`,
    );
    setPreparedMailto(`mailto:contact@ahadex.online?subject=${subject}&body=${body}`);
  };

  return (
    <>
      <Breadcrumbs />
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Contact Us
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-slate-700">
          Have a question, feature suggestion, or bug report? Reach out directly via email or
          prepare a formatted message below.
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-8 space-y-5 rounded-xl border border-slate-200 bg-slate-50/60 p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="contact-name" className="block text-xs font-semibold text-slate-800">
                Your Name
              </label>
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-brand-600 focus:outline-none"
              />
              {errors.name && (
                <p role="alert" className="mt-1 text-xs text-red-700">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="contact-email" className="block text-xs font-semibold text-slate-800">
                Email Address
              </label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-brand-600 focus:outline-none"
              />
              {errors.email && (
                <p role="alert" className="mt-1 text-xs text-red-700">
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="contact-topic" className="block text-xs font-semibold text-slate-800">
              Topic
            </label>
            <select
              id="contact-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-brand-600 focus:outline-none"
            >
              <option value="Bug Report">Bug Report</option>
              <option value="Feature Request">Feature Request</option>
              <option value="Privacy & Security">Privacy &amp; Security</option>
              <option value="Business & Partnerships">Business &amp; Partnerships</option>
            </select>
          </div>

          <div>
            <label htmlFor="contact-message" className="block text-xs font-semibold text-slate-800">
              Message
            </label>
            <textarea
              id="contact-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              placeholder="Include the tool name, browser/OS, and file format if reporting a bug..."
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-brand-600 focus:outline-none"
            />
            {errors.message && (
              <p role="alert" className="mt-1 text-xs text-red-700">
                {errors.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Validate &amp; Prepare Email
          </button>

          {preparedMailto && (
            <div
              role="status"
              className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
            >
              <p className="font-semibold">Message validated and ready to send.</p>
              <p className="mt-1 text-xs text-emerald-800">
                Because AHADEX Tools is a static privacy-first site without server-side form
                storage, open your email client below to send directly:
              </p>
              <a
                href={preparedMailto}
                className="mt-3 inline-flex items-center rounded-md bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
              >
                Open Email Draft
              </a>
            </div>
          )}
        </form>

        <div className="mt-10 space-y-4 text-sm leading-relaxed text-slate-700">
          <h2 className="font-display text-xl font-semibold text-slate-900">Direct Email</h2>
          <p>
            General inquiries, feedback, or bug reports:{' '}
            <a
              href="mailto:contact@ahadex.online"
              className="font-medium text-brand-600 underline hover:text-brand-700"
            >
              contact@ahadex.online
            </a>
          </p>
          <p>
            Business inquiries, advertising, or press:{' '}
            <a
              href="mailto:business@ahadex.online"
              className="font-medium text-brand-600 underline hover:text-brand-700"
            >
              business@ahadex.online
            </a>
          </p>

          <h2 className="pt-4 font-display text-xl font-semibold text-slate-900">Response Time</h2>
          <p>
            We typically respond within 2–3 business days. For urgent security or availability
            issues, include &quot;URGENT&quot; in the subject line.
          </p>
        </div>
      </div>
    </>
  );
}
