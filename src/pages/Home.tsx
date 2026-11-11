/**
 * Home page: unique hero, tool cards, trust, how it works.
 */

import { Link } from 'react-router-dom';
import { getToolRoutes } from '../router/route-registry';
import { getSiteConfig } from '../config/site';

const STEPS = [
  {
    title: 'Pick a tool',
    body: 'Choose the file operation you need from the tools list.',
  },
  {
    title: 'Drop your file',
    body: 'Your browser opens the file locally. No network request is made.',
  },
  {
    title: 'Download result',
    body: 'Processed on your device, downloaded back to your device.',
  },
];

export default function Home() {
  const site = getSiteConfig();
  const tools = getToolRoutes();

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="hero-orb hero-orb-a" style={{ width: 320, height: 320, top: '10%', left: '8%' }} />
          <div className="hero-orb hero-orb-b" style={{ width: 380, height: 380, top: '20%', right: '6%' }} />
          <div className="hero-orb hero-orb-c" style={{ width: 260, height: 260, bottom: '8%', left: '40%' }} />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-3 py-1 text-xs font-semibold text-gray-700 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Processed locally in your browser
          </span>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl md:text-7xl">
            <span className="rgb-text">{site.name}</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 sm:text-xl">
            {site.description}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Files stay on your device
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              0 KB sent to a server
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Works offline after first load
            </span>
          </div>
        </div>
      </section>

      {/* Tools */}
      <section id="tools" className="scroll-mt-24 pb-16">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Available tools</h2>
        </div>
        {tools.length === 0 ? (
          <p className="mt-6 text-gray-500">
            No tools are live yet. Check back soon.
          </p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <li key={tool.path}>
                <Link
                  to={tool.path}
                  className="group block h-full rounded-xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M13 3l-2 9h6l-6 9 2-9H7l6-9z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                    {tool.meta.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">{tool.meta.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Trust */}
      <section className="rounded-2xl bg-gray-50 p-8 sm:p-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Your files never leave your device
          </h2>
          <p className="mt-3 text-gray-600">
            All processing runs in your browser. No file is uploaded to any
            server. When you close the tab, the file is gone from memory.
          </p>
          <ul className="mt-8 grid gap-4 text-left sm:grid-cols-3">
            <li className="rounded-lg bg-white p-4 shadow-sm">
              <p className="font-semibold text-gray-900">0 KB sent to a server</p>
              <p className="mt-1 text-sm text-gray-600">Your file is loaded into browser memory only.</p>
            </li>
            <li className="rounded-lg bg-white p-4 shadow-sm">
              <p className="font-semibold text-gray-900">Works offline</p>
              <p className="mt-1 text-sm text-gray-600">After the first load, no network needed.</p>
            </li>
            <li className="rounded-lg bg-white p-4 shadow-sm">
              <p className="font-semibold text-gray-900">No account required</p>
              <p className="mt-1 text-sm text-gray-600">No signup, no email, no tracking of file contents.</p>
            </li>
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <h2 className="text-center text-2xl font-bold text-gray-900">How it works</h2>
        <ol className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-lg border border-gray-200 bg-white p-6">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
