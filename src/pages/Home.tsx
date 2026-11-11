/**
 * Home page. Lists available tools.
 */

import { Link } from 'react-router-dom';
import { getToolRoutes } from '../router/route-registry';
import { getSiteConfig } from '../config/site';

export default function Home() {
  const site = getSiteConfig();
  const tools = getToolRoutes();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          {site.name}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          {site.description}
        </p>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold text-gray-900">Available Tools</h2>
        {tools.length === 0 ? (
          <p className="mt-4 text-gray-500">No tools available yet.</p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <li key={tool.path}>
                <Link
                  to={tool.path}
                  className="block rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {tool.meta.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {tool.meta.description}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
